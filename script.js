/*
 * ============================================================
 *  E-Commerce Order Processor
 *  script.js
 * ============================================================
 *
 * How the code is organised:
 * 1.The raw (messy) order dat 
 * 2.Small helper functions,grouped by the built-in object they use (String,Number/Math,Date,RegExp)
 * 3.processOrder(): turns one messy order into a clean one using those helpers
 * 4.Render functions: one per section of the page
 * 5.Event listeners: hook the buttons up to the functions
 *
 * The golden rule I followed: NOTHING on the page is hardcoded.Every number,list and badge is calculated
 * from the orders array,so importing new orders (Challenge 7) updates the whole page on its own.
 *
 * MDN references:
 * String: developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
 * Date:   developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
 * Array:  developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
 * Set:    developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
 * Map:    developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
 * JSON:   developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON
 * RegExp: developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp
 */

// ============================================================
// CHALLENGE 0: The order dataset
// ============================================================
// This data is messy ON PURPOSE: extra spaces,random capitals,invalid emails,a price stored as text
// and one badly formatted order ID.The rest of the app has to clean all of it.
const orders = [
  { orderId: "ORD-0001", customerName: "  thabo   mokoena ", email: " Thabo.Mokoena@Gmail.com ", product: "Wireless Headphones", category: "Electronics", price: 1299.99, orderDate: "2026-10-18" },
  { orderId: "ORD-0002", customerName: "LERATO DLAMINI", email: "lerato.dlamini@gmail", product: "Running Shoes", category: "Sportswear", price: 899.5, orderDate: "2026-10-05" },
  { orderId: "ORD-0003", customerName: "sipho nkosi", email: "SIPHO@outlook.com", product: "Coffee Maker", category: "Home", price: 749, orderDate: "2026-09-12" },
  { orderId: "ORD-0004", customerName: "  aYanda   zulu", email: "ayanda.zulu@yahoo.co.za", product: "Smart Watch", category: "Electronics", price: 2499.95, orderDate: "2026-10-20" },
  { orderId: "ORD-0005", customerName: "naledi van wyk  ", email: "naledi vanwyk@mail.com", product: "Yoga Mat", category: "Sportswear", price: 349.9, orderDate: "2026-08-28" },
  { orderId: "ORD-0006", customerName: "Kagiso Molefe", email: "kagiso.molefe@icloud.com", product: "Desk Lamp", category: "Home", price: "289.99", orderDate: "2026-10-01" },
  { orderId: "ORD-0007", customerName: "zanele   KHUMALO", email: "  zanele.k@webmail.co.za", product: "Bluetooth Speaker", category: "Electronics", price: 1099, orderDate: "2026-07-15" },
  { orderId: "ORD-0008", customerName: "michael  smith", email: "michael.smith@gmail.com", product: "Novel: The Long Road", category: "Books", price: 199.99, orderDate: "2026-10-10" },
  { orderId: "ORD-0009", customerName: " PRIYA naidoo", email: "Priya.Naidoo@Company.CO.ZA", product: "Cookbook", category: "Books", price: 425.5, orderDate: "2026-09-25" },
  { orderId: "ORD-0010", customerName: "bongani   sithole", email: "bongani@sithole@mail.com", product: "Gaming Mouse", category: "Electronics", price: 649.0, orderDate: "2026-10-14" },
  { orderId: "ORD11", customerName: "  anele  mthembu ", email: "anele.mthembu@gmail.com", product: "Wireless Headphones", category: "Electronics", price: 1299.99, orderDate: "2026-06-30" },
  { orderId: "ORD-0012", customerName: "emma o'connor", email: "EMMA.OCONNOR@mail.com", product: "Throw Blanket", category: "Home", price: 529.75, orderDate: "2026-10-16" },
];

// Settings in one place so they're easy to change.
const VAT_RATE = 0.15;
const DISCOUNT_THRESHOLD = 1000; // orders above this get a discount
const DISCOUNT_RATE = 0.1;
const RECENT_DAYS = 30;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Which way the Orders table is sorted.Changed by the sort buttons.
let sortNewestFirst = true;

// ============================================================
// CHALLENGE 1: Clean customer data (String)
// ============================================================

// Removes spaces at the start and end with trim(),then squashes any run of spaces in the middle into one.
// " thabo   mokoena " becomes "thabo mokoena".
function removeExtraSpaces(text) {
  return String(text).trim().replace(/\s+/g, " ");
}

// Capitalises the first letter of every word and makes the rest lowercase.
// split(" ") breaks the name into words,and join(" ") puts them back together.
function formatName(name) {
  return removeExtraSpaces(name)
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Emails aren't case sensitive,so lowercase is the standard way to store them.
function cleanEmail(email) {
  return removeExtraSpaces(email).toLowerCase();
}

function getFirstName(cleanName) {
  return cleanName.split(" ")[0];
}

// The domain is everything after the @.If there's no @ at all there's no domain to extract.
function getEmailDomain(cleanedEmail) {
  if (!cleanedEmail.includes("@")) {
    return "no domain";
  }
  return cleanedEmail.slice(cleanedEmail.lastIndexOf("@") + 1);
}

// Makes text safe to put inside HTML.This matters for imported JSON: without it,someone could paste
// a "name" like <img onerror=...> and it would run as code on the page.
function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// ============================================================
// CHALLENGE 2: Calculate prices (Number and Math)
// ============================================================

// parseFloat turns a price stored as text (like "289.99") into a real number.
// Math.round(x * 100) / 100 rounds to the nearest cent.
function toPrice(value) {
  const number = parseFloat(value);
  return Number.isFinite(number) ? Math.round(number * 100) / 100 : NaN;
}

// "R 1,299.99": toFixed(2) gives exactly two decimals,then the pattern adds a comma every three digits.
function formatRand(amount) {
  if (!Number.isFinite(amount)) {
    return "Invalid price";
  }
  const [rands, cents] = amount.toFixed(2).split(".");
  return `R ${rands.replace(/\B(?=(\d{3})+(?!\d))/g,",")}.${cents}`;
}

function calculateVat(price) {
  return Math.round(price * VAT_RATE * 100) / 100;
}

// Orders over the threshold get 10% off.Everything else gets 0.
function calculateDiscount(price) {
  return price > DISCOUNT_THRESHOLD ? Math.round(price * DISCOUNT_RATE * 100) / 100 : 0;
}

// ============================================================
// CHALLENGE 3: Work with order dates (Date)
// ============================================================

// I split "2026-10-18" into its parts and build the Date myself.new Date("2026-10-18") is read as UTC midnight,
// which can show the PREVIOUS day in some time zones.new Date(year,monthIndex,day) uses local time instead.
// Note: months in JavaScript start at 0,so October is 9,which is why I subtract 1.
function parseOrderDate(dateText) {
  const [year, month, day] = String(dateText).split("-").map(Number);
  const date = new Date(year, month - 1, day);
  // getTime() is NaN for an invalid date,so this catches nonsense like "2026-13-45" or "yesterday".
  return Number.isNaN(date.getTime()) ? null : date;
}

// "21 October 2026"
function formatReadableDate(date) {
  return date ? date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "Invalid date";
}

// Today at midnight,so "days ago" counts whole days and isn't thrown off by the current time.
function getToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// getTime() gives milliseconds since 1970.The difference divided by the milliseconds in a day = days.
function daysAgo(date) {
  return date ? Math.round((getToday().getTime() - date.getTime()) / MS_PER_DAY) : NaN;
}

function describeDaysAgo(days) {
  if (Number.isNaN(days)) return "";
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 0) return `in ${Math.abs(days)} days`;
  return `${days} days ago`;
}

// ============================================================
// CHALLENGE 8: Validate with patterns (RegExp)
// (defined early because processOrder() uses them)
// ============================================================

// Email: something without spaces or @,then one @,then a domain with at least one dot and a 2+ letter ending.
// It catches "lerato.dlamini@gmail" (no ending),"naledi vanwyk@mail.com" (space) and "bongani@sithole@mail.com" (two @).
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

// Order ID: exactly "ORD-" followed by 4 digits,for example ORD-0001."ORD11" fails.
const ORDER_ID_PATTERN = /^ORD-\d{4}$/;

function isValidEmail(email) {
  return EMAIL_PATTERN.test(email);
}

function isValidOrderId(orderId) {
  return ORDER_ID_PATTERN.test(orderId);
}

// ============================================================
// Turning a messy order into a clean one
// ============================================================

// Uses all the helpers above.The original order stays untouched,this returns a NEW cleaned object.
function processOrder(rawOrder) {
  const customerName = formatName(rawOrder.customerName ?? "");
  const email = cleanEmail(rawOrder.email ?? "");
  const price = toPrice(rawOrder.price);
  const date = parseOrderDate(rawOrder.orderDate);
  const age = daysAgo(date);

  return {
    orderId: removeExtraSpaces(rawOrder.orderId ?? "").toUpperCase(),
    customerName,
    firstName: getFirstName(customerName),
    rawName: String(rawOrder.customerName ?? ""),
    email,
    emailDomain: getEmailDomain(email),
    product: removeExtraSpaces(rawOrder.product ?? ""),
    category: formatName(rawOrder.category ?? "Uncategorised"),
    price,
    vat: calculateVat(price),
    discount: calculateDiscount(price),
    orderDate: rawOrder.orderDate,
    date,
    daysAgo: age,
    isRecent: age >= 0 && age <= RECENT_DAYS,
    emailValid: isValidEmail(email),
    orderIdValid: isValidOrderId(removeExtraSpaces(rawOrder.orderId ?? "").toUpperCase()),
  };
}

// Always recalculated from the current orders array,so it's never out of date.
function getCleanOrders() {
  return orders.map(processOrder);
}

// ============================================================
// Small display helpers (Tailwind badges)
// ============================================================
function badge(text, colour) {
  const colours = {
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-indigo-100 text-indigo-700",
    amber: "bg-amber-100 text-amber-700",
    slate: "bg-slate-200 text-slate-700",
  };
  return `<span class="inline-block text-xs font-medium px-2 py-0.5 rounded-full ${colours[colour]}">${escapeHtml(text)}</span>`;
}

function statCard(label, value, detail = "") {
  return `
    <div class="bg-slate-50 border border-slate-200 rounded-lg p-4">
      <p class="text-xs uppercase tracking-wide text-slate-500">${escapeHtml(label)}</p>
      <p class="text-lg font-bold mt-1">${escapeHtml(value)}</p>
      ${detail ? `<p class="text-xs text-slate-500 mt-1">${escapeHtml(detail)}</p>` : ""}
    </div>`;
}

// ============================================================
// RENDER: Orders section (Challenges 0,1,2,3,8)
// ============================================================
function renderOrders() {
  const cleanOrders = getCleanOrders();

  // Sorting by date: compare getTime() values.Orders with an invalid date go to the bottom.
  cleanOrders.sort((a, b) => {
    const timeA = a.date ? a.date.getTime() : -Infinity;
    const timeB = b.date ? b.date.getTime() : -Infinity;
    return sortNewestFirst ? timeB - timeA : timeA - timeB;
  });

  const rows = cleanOrders.map((order) => {
    const nameChanged = order.rawName !== order.customerName;
    return `
      <tr class="hover:bg-slate-50 align-top">
        <td class="px-3 py-3 whitespace-nowrap">
          <p class="font-mono">${escapeHtml(order.orderId)}</p>
          ${order.orderIdValid ? badge("valid ID","green") : badge("invalid ID","red")}
        </td>
        <td class="px-3 py-3">
          <p class="font-medium">${escapeHtml(order.customerName)}</p>
          <p class="text-xs text-slate-500">First name: ${escapeHtml(order.firstName)}</p>
          ${nameChanged ? `<p class="text-xs text-slate-400 font-mono">was: "${escapeHtml(order.rawName)}"</p>` : ""}
        </td>
        <td class="px-3 py-3">
          <p>${escapeHtml(order.email)}</p>
          <p class="text-xs text-slate-500">Domain: ${escapeHtml(order.emailDomain)}</p>
          ${order.emailValid ? badge("valid email","green") : badge("invalid email","red")}
        </td>
        <td class="px-3 py-3">${escapeHtml(order.product)}</td>
        <td class="px-3 py-3">${badge(order.category,"blue")}</td>
        <td class="px-3 py-3 text-right whitespace-nowrap">
          <p class="font-semibold">${formatRand(order.price)}</p>
          <p class="text-xs text-slate-500">+ VAT ${formatRand(order.vat)}</p>
          ${order.discount > 0 ? `<p class="text-xs text-emerald-600">10% off: -${formatRand(order.discount)}</p>` : ""}
        </td>
        <td class="px-3 py-3 whitespace-nowrap">
          <p>${formatReadableDate(order.date)}</p>
          <p class="text-xs text-slate-500">${describeDaysAgo(order.daysAgo)}</p>
          ${order.isRecent ? badge("recent","amber") : badge("older","slate")}
        </td>
      </tr>`;
  });

  document.getElementById("ordersTableBody").innerHTML = rows.join("");
  document.getElementById("ordersCount").textContent = `Showing all ${cleanOrders.length} orders,sorted ${sortNewestFirst ? "newest" : "oldest"} first.`;

  // Highlight whichever sort button is active.
  const active = "bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3 py-2 rounded-lg";
  const inactive = "bg-slate-200 hover:bg-slate-300 text-sm px-3 py-2 rounded-lg";
  document.getElementById("sortNewestBtn").className = sortNewestFirst ? active : inactive;
  document.getElementById("sortOldestBtn").className = sortNewestFirst ? inactive : active;
}

// ============================================================
// CHALLENGE 5: Unique categories (Set)
// ============================================================

// A Set only keeps unique values,so "Electronics" appears once no matter how many orders have it.
function getUniqueCategories() {
  return new Set(getCleanOrders().map((order) => order.category));
}

function renderCategories() {
  const categories = getUniqueCategories();

  document.getElementById("categoryList").innerHTML =
    [...categories].map((category) => badge(category, "blue")).join(" ") +
    `<p class="w-full text-sm text-slate-500 mt-3">${categories.size} unique categories</p>`;

  // The filter dropdown is built from the same Set,so a new category from an import shows up here too.
  const select = document.getElementById("categorySelect");
  const previous = select.value;
  select.innerHTML =
    `<option value="all">All categories</option>` +
    [...categories].map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("");
  // Keep the user's choice selected after a re-render if it still exists.
  if (categories.has(previous)) {
    select.value = previous;
  }
}

// ============================================================
// CHALLENGE 6: Product lookup (Map)
// ============================================================

// Map key = product name,value = an object with its details.If two orders have the same product,
// I keep one entry and count how many times it was ordered.
function buildProductMap() {
  const productMap = new Map();
  for (const order of getCleanOrders()) {
    if (productMap.has(order.product)) {
      productMap.get(order.product).timesOrdered += 1;
    } else {
      productMap.set(order.product, { price: order.price, category: order.category, timesOrdered: 1 });
    }
  }
  return productMap;
}

function renderProductOptions() {
  const productMap = buildProductMap();
  document.getElementById("productCount").textContent = `${productMap.size} different products available.Pick one from the list or type a name.`;
  // keys() gives every product name,which I use for the suggestions list.
  document.getElementById("productOptions").innerHTML = [...productMap.keys()]
    .map((name) => `<option value="${escapeHtml(name)}"></option>`)
    .join("");
}

function lookUpProduct() {
  const productMap = buildProductMap();
  const typed = removeExtraSpaces(document.getElementById("productInput").value);
  const resultBox = document.getElementById("lookupResult");

  if (typed === "") {
    resultBox.innerHTML = `<p class="text-amber-700">Please type a product name first.</p>`;
    return;
  }

  // Map keys are case sensitive,so I find the real key that matches whatever capitals the user typed.
  const matchingKey = [...productMap.keys()].find((name) => name.toLowerCase() === typed.toLowerCase());

  if (!matchingKey) {
    resultBox.innerHTML = `<p class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3">No product called "${escapeHtml(typed)}" was found.Check the spelling or choose one from the suggestions.</p>`;
    return;
  }

  const details = productMap.get(matchingKey);
  resultBox.innerHTML = `
    <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-1">
      <p class="font-semibold text-base">${escapeHtml(matchingKey)}</p>
      <p>Price: <span class="font-medium">${formatRand(details.price)}</span> (incl.VAT ${formatRand(details.price + calculateVat(details.price))})</p>
      <p>Category: ${badge(details.category,"blue")}</p>
      <p>Times ordered: ${details.timesOrdered}</p>
    </div>`;
}

// ============================================================
// CHALLENGE 4: Search,filter and analyse (Array methods)
// ============================================================

function showResults(html) {
  document.getElementById("searchResults").innerHTML = html;
}

// A compact list used for search and filter results.
function resultList(list) {
  if (list.length === 0) {
    return `<p class="text-slate-500">No orders match.</p>`;
  }
  return `<ul class="divide-y divide-slate-200">${list
    .map(
      (order) => `
      <li class="py-2 flex flex-wrap justify-between gap-2">
        <span><span class="font-mono">${escapeHtml(order.orderId)}</span> ${escapeHtml(order.customerName)} | ${escapeHtml(order.product)} ${badge(order.category, "blue")}</span>
        <span class="font-semibold">${formatRand(order.price)}</span>
      </li>`
    )
    .join("")}</ul>`;
}

// find(): returns the FIRST order that matches,or undefined if nothing does.
function findOrder() {
  const query = removeExtraSpaces(document.getElementById("searchInput").value).toLowerCase();
  if (query === "") {
    showResults(`<p class="text-amber-700">Type an order ID or a customer name to search.</p>`);
    return;
  }

  const found = getCleanOrders().find(
    (order) => order.orderId.toLowerCase() === query || order.customerName.toLowerCase().includes(query)
  );

  showResults(
    found
      ? `<p class="font-semibold mb-2">Order found:</p>${resultList([found])}`
      : `<p class="text-red-700">No order matches "${escapeHtml(query)}".</p>`
  );
}

// filter(): keeps EVERY order that passes the test.I chain two filters: category,then price range.
function filterOrders() {
  const category = document.getElementById("categorySelect").value;
  const minText = document.getElementById("minPrice").value;
  const maxText = document.getElementById("maxPrice").value;
  // Empty boxes mean "no limit".
  const min = minText === "" ? 0 : parseFloat(minText);
  const max = maxText === "" ? Infinity : parseFloat(maxText);

  if (min > max) {
    showResults(`<p class="text-red-700">The minimum price can't be more than the maximum price.</p>`);
    return;
  }

  const results = getCleanOrders()
    .filter((order) => category === "all" || order.category === category)
    .filter((order) => order.price >= min && order.price <= max);

  // reduce(): adds up the prices of just the filtered orders.
  const filteredTotal = results.reduce((sum, order) => sum + order.price, 0);

  showResults(`
    <p class="font-semibold mb-2">${results.length} order(s) found.Total value: ${formatRand(filteredTotal)}</p>
    ${resultList(results)}`);
}

function resetFilter() {
  document.getElementById("categorySelect").value = "all";
  document.getElementById("minPrice").value = "";
  document.getElementById("maxPrice").value = "";
  document.getElementById("searchInput").value = "";
  showResults(`<p class="text-slate-500">Filters cleared.Results will appear here.</p>`);
}

// map(): builds a NEW array (product + price incl.VAT) without changing the original orders.
function showVatPrices() {
  const withVat = getCleanOrders().map((order) => ({
    product: order.product,
    priceInclVat: Math.round((order.price + order.vat) * 100) / 100,
  }));

  showResults(`
    <p class="font-semibold mb-2">Product prices including 15% VAT (built with map):</p>
    <ul class="grid sm:grid-cols-2 gap-1">
      ${withVat.map((item) => `<li class="flex justify-between border-b border-slate-200 py-1"><span>${escapeHtml(item.product)}</span><span>${formatRand(item.priceInclVat)}</span></li>`).join("")}
    </ul>`);
}

// some(): true if AT LEAST ONE order passes.It stops checking as soon as it finds one.
function checkAnyOver() {
  const cleanOrders = getCleanOrders();
  const anyOver = cleanOrders.some((order) => order.price > DISCOUNT_THRESHOLD);
  const howMany = cleanOrders.filter((order) => order.price > DISCOUNT_THRESHOLD).length;
  showResults(
    anyOver
      ? `<p class="text-emerald-700 font-semibold">Yes,${howMany} order(s) are over R1,000.</p>`
      : `<p class="text-slate-700 font-semibold">No,no orders are over R1,000.</p>`
  );
}

// every(): true only if ALL orders pass.One invalid price makes the whole answer false.
function checkAllValid() {
  const cleanOrders = getCleanOrders();
  const allValid = cleanOrders.every((order) => Number.isFinite(order.price) && order.price > 0);
  showResults(
    allValid
      ? `<p class="text-emerald-700 font-semibold">Yes,all ${cleanOrders.length} orders have a valid price above R0.</p>`
      : `<p class="text-red-700 font-semibold">No,at least one order has a missing or invalid price.</p>`
  );
}

// reduce(): walks through the array keeping a running total.
function showTotal() {
  const total = getCleanOrders().reduce((sum, order) => sum + (Number.isFinite(order.price) ? order.price : 0), 0);
  showResults(`<p class="font-semibold">Total value of all orders (reduce): ${formatRand(total)}</p>`);
}

// ============================================================
// CHALLENGE 9: Statistics dashboard
// ============================================================
function renderStatistics() {
  const cleanOrders = getCleanOrders();
  const validPriced = cleanOrders.filter((order) => Number.isFinite(order.price));
  const prices = validPriced.map((order) => order.price);

  if (prices.length === 0) {
    document.getElementById("statsGrid").innerHTML = statCard("Total orders", String(cleanOrders.length), "No valid prices yet");
    document.getElementById("categoryCounts").innerHTML = "";
    return;
  }

  const total = prices.reduce((sum, price) => sum + price, 0);
  const average = total / prices.length;
  // Math.max and Math.min need separate numbers,so the spread operator (...) unpacks the array into them.
  const highest = Math.max(...prices);
  const lowest = Math.min(...prices);
  const highestOrder = validPriced.find((order) => order.price === highest);
  const lowestOrder = validPriced.find((order) => order.price === lowest);
  const validEmails = cleanOrders.filter((order) => order.emailValid).length;
  const recentCount = cleanOrders.filter((order) => order.isRecent).length;
  const totalVat = validPriced.reduce((sum, order) => sum + order.vat, 0);

  document.getElementById("statsGrid").innerHTML = [
    statCard("Total orders", String(cleanOrders.length)),
    statCard("Total order value", formatRand(total), `VAT on top: ${formatRand(totalVat)}`),
    statCard("Average order", formatRand(Math.round(average * 100) / 100)),
    statCard("Highest-priced order", formatRand(highest), `${highestOrder.product} (${highestOrder.orderId})`),
    statCard("Lowest-priced order", formatRand(lowest), `${lowestOrder.product} (${lowestOrder.orderId})`),
    statCard("Unique categories", String(getUniqueCategories().size)),
    statCard("Valid emails", String(validEmails), `${cleanOrders.length - validEmails} invalid`),
    statCard("Recent orders", String(recentCount), `placed in the last ${RECENT_DAYS} days`),
    statCard("Most expensive product", highestOrder.product, formatRand(highest)),
    statCard("Different products", String(buildProductMap().size)),
  ].join("");

  // Orders per category: reduce builds an object like { Electronics: 5,Home: 3 }.
  const perCategory = cleanOrders.reduce((counts, order) => {
    counts[order.category] = (counts[order.category] ?? 0) + 1;
    return counts;
  }, {});

  document.getElementById("categoryCounts").innerHTML = Object.entries(perCategory)
    .map(([category, count]) => badge(`${category}: ${count}`, "blue"))
    .join(" ");
}

// ============================================================
// CHALLENGE 7: Export and import (JSON)
// ============================================================

// Exports the CLEANED orders (only the main fields) as nicely indented JSON.
// The third argument to JSON.stringify (2) adds indentation so it's readable.
function renderExport() {
  const exportable = getCleanOrders().map((order) => ({
    orderId: order.orderId,
    customerName: order.customerName,
    email: order.email,
    product: order.product,
    category: order.category,
    price: order.price,
    orderDate: order.orderDate,
  }));
  document.getElementById("exportOutput").value = JSON.stringify(exportable, null, 2);
}

function showImportMessage(text, isError) {
  const colour = isError ? "text-red-700 bg-red-50 border-red-200" : "text-emerald-700 bg-emerald-50 border-emerald-200";
  document.getElementById("importMessage").innerHTML = `<p class="border rounded-lg p-3 ${colour}">${escapeHtml(text)}</p>`;
}

function importOrders() {
  const text = document.getElementById("importInput").value.trim();
  if (text === "") {
    showImportMessage("Paste some JSON first.", true);
    return;
  }

  let parsed;
  // JSON.parse throws an error on invalid JSON (a missing quote,a trailing comma...).try/catch stops that from
  // crashing the app and lets me show a friendly message instead.
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    showImportMessage(`That isn't valid JSON: ${error.message}`, true);
    return;
  }

  // Accept a single order object OR an array of orders.
  const incoming = Array.isArray(parsed) ? parsed : [parsed];
  const requiredFields = ["orderId", "customerName", "email", "product", "category", "price", "orderDate"];

  // Valid JSON can still be the wrong shape,so check every order has every field before adding anything.
  const problem = incoming.find(
    (item) => typeof item !== "object" || item === null || !requiredFields.every((field) => field in item)
  );
  if (problem !== undefined) {
    showImportMessage(`Every order needs these fields: ${requiredFields.join(",")}.Nothing was imported.`, true);
    return;
  }

  orders.push(...incoming);
  renderAll();
  showImportMessage(`Imported ${incoming.length} order(s).The whole page has been updated.`, false);
  document.getElementById("importInput").value = "";
}

function pasteSampleOrder() {
  const sample = [
    {
      orderId: "ORD-0013",
      customerName: "  neo   DUBE ",
      email: "NEO.Dube@Shop.co.za",
      product: "Plant Pot Set",
      category: "garden",
      price: 315.4,
      orderDate: new Date().toISOString().slice(0, 10), // today's date in YYYY-MM-DD format
    },
  ];
  document.getElementById("importInput").value = JSON.stringify(sample, null, 2);
}

// ============================================================
// CHALLENGE 8: Validation tool (RegExp)
// ============================================================
function validateValue() {
  const type = document.getElementById("validationType").value;
  const value = document.getElementById("validationInput").value.trim();
  const resultBox = document.getElementById("validationResult");

  if (value === "") {
    resultBox.innerHTML = `<p class="text-amber-700">Type something to test.</p>`;
    return;
  }

  const passes = type === "email" ? isValidEmail(value) : isValidOrderId(value);
  const ruleText =
    type === "email"
      ? "An email needs text,one @,a domain,a dot and an ending of at least 2 letters (no spaces)."
      : "An order ID must be ORD- followed by exactly 4 digits,for example ORD-0001.";

  resultBox.innerHTML = passes
    ? `<p class="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg p-3">"${escapeHtml(value)}" is VALID.</p>`
    : `<p class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3">"${escapeHtml(value)}" is INVALID.${ruleText}</p>`;
}

// ============================================================
// Render everything (called on page load and after every import)
// ============================================================
function renderAll() {
  renderStatistics();
  renderOrders();
  renderCategories();
  renderProductOptions();
  renderExport();
}

// ============================================================
// Event listeners
// ============================================================
document.getElementById("sortNewestBtn").addEventListener("click", () => {
  sortNewestFirst = true;
  renderOrders();
});
document.getElementById("sortOldestBtn").addEventListener("click", () => {
  sortNewestFirst = false;
  renderOrders();
});

document.getElementById("findBtn").addEventListener("click", findOrder);
document.getElementById("filterBtn").addEventListener("click", filterOrders);
document.getElementById("resetFilterBtn").addEventListener("click", resetFilter);
document.getElementById("vatListBtn").addEventListener("click", showVatPrices);
document.getElementById("anyOverBtn").addEventListener("click", checkAnyOver);
document.getElementById("allValidBtn").addEventListener("click", checkAllValid);
document.getElementById("totalBtn").addEventListener("click", showTotal);
document.getElementById("lookupBtn").addEventListener("click", lookUpProduct);
document.getElementById("importBtn").addEventListener("click", importOrders);
document.getElementById("sampleBtn").addEventListener("click", pasteSampleOrder);
document.getElementById("validateBtn").addEventListener("click", validateValue);

// Pressing Enter in a text box does the same as clicking its button.
document.getElementById("searchInput").addEventListener("keydown", (event) => event.key === "Enter" && findOrder());
document.getElementById("productInput").addEventListener("keydown", (event) => event.key === "Enter" && lookUpProduct());
document.getElementById("validationInput").addEventListener("keydown", (event) => event.key === "Enter" && validateValue());

renderAll();
