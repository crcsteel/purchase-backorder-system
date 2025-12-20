// =================================================
// GLOBAL STATE
// =================================================
let incomingRows = [];
let pendingRows = [];
let filteredIncoming = [];
let filteredPending = [];

let currentPageIncoming = 1;
let currentPagePending = 1;
let rowsPerPage = 20;

let incomingSortCol = -1;
let incomingSortAsc = true;
let pendingSortCol = -1;
let pendingSortAsc = true;

let sheetLoaded = false;

// =================================================
// LOADING
// =================================================
function showLoading() {
  document.getElementById("loadingOverlay")?.classList.remove("hidden");
}
function hideLoading() {
  document.getElementById("loadingOverlay")?.classList.add("hidden");
}

// =================================================
// GOOGLE SHEET (GVIZ)
// =================================================
async function loadSheet(SHEET_ID, SHEET_NAME) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${SHEET_NAME}&tqx=out:json`;
  const res = await fetch(url);
  const text = await res.text();
  const json = JSON.parse(text.substring(47, text.length - 2));
  return json.table.rows.map(r => r.c.map(c => c ? c.v : ""));
}

// =================================================
// LOAD ALL DATA (ONCE)
// =================================================
async function loadAllSheets() {
  if (sheetLoaded) return;

  showLoading();

  incomingRows = await loadSheet(
    "1N_qX_beldGyLspfU6lgeskWd-aYu6ugAhRFTrHgO_Sw",
    "rptbackorder"
  );
  filteredIncoming = [...incomingRows];

  pendingRows = await loadSheet(
    "1IWE5UgDgkANHHmEyHPOmlU-xhxqbvSq6sOCBycgQfcA",
    "rptbackorder"
  );
  filteredPending = [...pendingRows];

  sheetLoaded = true;
  hideLoading();
}

// =================================================
// PAGE INIT (เรียกจาก index.html)
// =================================================
async function initPage1() {
  await loadAllSheets();
  renderIncomingTable();
  renderIncomingCards();
  renderIncomingPagination();
  bindIncomingFilters();
}

async function initPage2() {
  await loadAllSheets();
  renderPendingTable();
  renderPendingCards();
  renderPendingTablePagination();
  bindPendingFilters();
}

function initPage3() {
  if (typeof initCalendar === "function") initCalendar();
}

async function initPage4() {
  await loadAllSheets();
}

// =================================================
// TOGGLE FILTER
// =================================================
function toggleFilters() {
  const p1 = document.getElementById("page1");
  const p2 = document.getElementById("page2");

  if (p1 && !p1.classList.contains("hidden")) {
    p1.querySelector("#filterGrid")?.classList.toggle("hidden");
  }
  if (p2 && !p2.classList.contains("hidden")) {
    p2.querySelector("#filterGrid2")?.classList.toggle("hidden");
  }
}

// =================================================
// FORMAT / DATE
// =================================================
function formatNumber(v) {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  return isNaN(n) ? v : n.toLocaleString("en-US");
}

function formatDateTH(input) {
  if (!input) return "";
  const pad = n => String(n).padStart(2, "0");

  if (typeof input === "string" && input.startsWith("Date(")) {
    const [y, m, d] = input.replace(/[Date()]/g, "").split(",");
    return `${pad(d)}/${pad(+m + 1)}/${+y + 543}`;
  }

  const dt = new Date(input);
  if (!isNaN(dt)) {
    return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear() + 543}`;
  }
  return input;
}

function parseDate(str) {
  if (!str) return new Date("1900-01-01");
  const [d, m, y] = formatDateTH(str).split("/");
  return new Date(+y - 543, +m - 1, +d);
}

// =================================================
// PAGE 1 – INCOMING
// =================================================
function renderIncomingTable() {
  const tbody = document.getElementById("incomingBody");
  if (!tbody) return;

  tbody.innerHTML = "";
  const start = (currentPageIncoming - 1) * rowsPerPage;

  filteredIncoming.slice(start, start + rowsPerPage).forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="status-badge ${getBranchBadgeClass(r[0])}">${r[0] ?? ""}</td>
      <td>${formatDateTH(r[1])}</td>
      <td>${r[2] ?? ""}</td>
      <td>${r[3] ?? ""}</td>
      <td>${r[4] ?? ""}</td>
      <td>${formatNumber(r[5])}</td>
      <td>${r[6] ?? ""}</td>
      <td>${formatNumber(r[7])}</td>
      <td>${r[8] ?? ""}</td>
      <td>${r[9] ?? ""}</td>
      <td>${badge(r[10])}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderIncomingCards() {
  const box = document.getElementById("incomingCards");
  if (!box) return;

  box.innerHTML = "";
  const start = (currentPageIncoming - 1) * rowsPerPage;

  filteredIncoming.slice(start, start + rowsPerPage).forEach(r => {
    const div = document.createElement("div");
    div.className = "data-card";
    div.innerHTML = `
      <b>${r[4] ?? ""}</b><br>
      ${formatDateTH(r[1])}<br>
      ${formatNumber(r[7])} ${r[8] ?? ""}
    `;
    box.appendChild(div);
  });
}

// =================================================
// PAGE 1 SORT
// =================================================
function sortIncoming(col) {
  incomingSortAsc = incomingSortCol === col ? !incomingSortAsc : true;
  incomingSortCol = col;

  filteredIncoming.sort((a, b) => {
    let A = a[col], B = b[col];
    if (col === 1) { A = parseDate(A); B = parseDate(B); }
    if ([5,7].includes(col)) { A = Number(A)||0; B = Number(B)||0; }
    return A > B ? (incomingSortAsc?1:-1) : A < B ? (incomingSortAsc?-1:1) : 0;
  });

  currentPageIncoming = 1;
  renderIncomingTable();
  renderIncomingCards();
  renderIncomingPagination();
}

// =================================================
// PAGE 1 PAGINATION
// =================================================
function renderIncomingPagination() {
  const box = document.getElementById("incomingPagination");
  if (!box) return;

  const total = Math.ceil(filteredIncoming.length / rowsPerPage);
  let html = "";

  for (let i=1;i<=total;i++) {
    html += `<button class="${i===currentPageIncoming?'active':''}"
      onclick="goIncomingPage(${i})">${i}</button>`;
  }
  box.innerHTML = html;
}

function goIncomingPage(p) {
  currentPageIncoming = p;
  renderIncomingTable();
  renderIncomingCards();
}

// =================================================
// PAGE 2 – PENDING
// =================================================
function renderPendingTable() {
  const tbody = document.getElementById("pendingBody");
  if (!tbody) return;

  tbody.innerHTML = "";
  const start = (currentPagePending - 1) * rowsPerPage;

  filteredPending.slice(start, start + rowsPerPage).forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td>
      <td>${r[3]}</td><td>${r[4]}</td><td>${formatDateTH(r[5])}</td>
      <td>${r[6]}</td><td>${r[7]}</td><td>${r[8]}</td>
      <td>${r[9]}</td><td>${r[10]}</td><td>${r[11]}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPendingCards() {
  const box = document.getElementById("pendingCards");
  if (!box) return;

  box.innerHTML = "";
  const start = (currentPagePending - 1) * rowsPerPage;

  filteredPending.slice(start, start + rowsPerPage).forEach(r => {
    const div = document.createElement("div");
    div.className = "data-card";
    div.innerHTML = `<b>${r[2]}</b><br>${formatDateTH(r[5])}`;
    box.appendChild(div);
  });
}

// =================================================
// PAGE 2 SORT / CHIP
// =================================================
function chipPending(type) {
  if (type === "ทุกสาขา") filteredPending = [...pendingRows];
  else {
    const map = { "สุรินทร์":"PO","นางรอง":"PN","เดชอุดม":"PU" };
    filteredPending = pendingRows.filter(r =>
      String(r[7]).startsWith(map[type]||"")
    );
  }
  currentPagePending = 1;
  renderPendingTable();
  renderPendingCards();
  renderPendingTablePagination();
}

// =================================================
// PAGE 2 PAGINATION
// =================================================
function renderPendingTablePagination() {
  const box = document.getElementById("pendingPagination");
  if (!box) return;

  const total = Math.ceil(filteredPending.length / rowsPerPage);
  let html = "";

  for (let i=1;i<=total;i++) {
    html += `<button class="${i===currentPagePending?'active':''}"
      onclick="goPendingPage(${i})">${i}</button>`;
  }
  box.innerHTML = html;
}

function goPendingPage(p) {
  currentPagePending = p;
  renderPendingTable();
  renderPendingCards();
}

// =================================================
// FILTER BIND
// =================================================
function bindIncomingFilters() {
  const page = document.getElementById("page1");
  if (!page) return;

  page.querySelectorAll("input,select").forEach(el =>
    el.oninput = applyIncomingFilters
  );
}

function applyIncomingFilters() {
  const page = document.getElementById("page1");
  if (!page) return;

  let rows = [...incomingRows];
  const supplier = page.querySelector("input[placeholder='Search supplier...']")?.value.toLowerCase() || "";
  const group = page.querySelector("input[placeholder='Search Product Group...']")?.value.toLowerCase() || "";
  const code = page.querySelector("input[placeholder='Search Product Code...']")?.value.toLowerCase() || "";
  const branch = page.querySelector("select")?.value || "ทุกสาขา";

  if (supplier) rows = rows.filter(r => String(r[9]).toLowerCase().includes(supplier));
  if (group) rows = rows.filter(r => String(r[2]).toLowerCase().includes(group));
  if (code) rows = rows.filter(r => String(r[3]).toLowerCase().includes(code));
  if (branch !== "ทุกสาขา") rows = rows.filter(r => r[0] === branch);

  filteredIncoming = rows;
  currentPageIncoming = 1;
  renderIncomingTable();
  renderIncomingCards();
  renderIncomingPagination();
}

function bindPendingFilters() {
  const page = document.getElementById("page2");
  if (!page) return;

  page.querySelectorAll(".filter-input").forEach(el =>
    el.oninput = applyPendingFilters
  );
}

function applyPendingFilters() {
  const page = document.getElementById("page2");
  if (!page) return;

  const code = page.querySelector("input[placeholder='Search Item Code...']")?.value.toLowerCase() || "";
  filteredPending = pendingRows.filter(r =>
    !code || String(r[1]).toLowerCase().includes(code)
  );

  currentPagePending = 1;
  renderPendingTable();
  renderPendingCards();
  renderPendingTablePagination();
}

// =================================================
// HELPERS
// =================================================
function getBranchBadgeClass(b) {
  return b === "สุรินทร์" ? "branch-blue"
       : b === "นางรอง" ? "branch-green"
       : b === "เดชอุดม" ? "branch-yellow"
       : "branch-default";
}

function badge(status) {
  if (!status) return "-";
  status = status.toLowerCase();
  if (status.includes("completed")) return `<span class="status-completed">Completed</span>`;
  if (status.includes("pending")) return `<span class="status-pending">Pending</span>`;
  return status;
}
