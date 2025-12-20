/* ============================================================
   CONFIG
============================================================ */
const SHEET_ID = "1O3j7OxnEpngIuQJUBGhOm5TG4qlFdEWmqizjqUbKkic";
const SHEET_NAME = "DATA";

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let paymentData = [];

/* ============================================================
   CONSTANTS
============================================================ */
const thaiMonths = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const thaiHolidays = {
  "01-01": "วันขึ้นปีใหม่",
  "01-02": "วันหยุดปีใหม่",
  "04-06": "วันจักรี",
  "04-13": "วันสงกรานต์",
  "04-14": "วันสงกรานต์",
  "04-15": "วันสงกรานต์",
  "05-01": "วันแรงงาน",
  "05-05": "วันฉัตรมงคล",
  "07-28": "เฉลิมพระชนมพรรษา",
  "08-12": "วันแม่",
  "10-13": "วันคล้ายวันสวรรคต",
  "10-23": "วันปิยมหาราช",
  "12-05": "วันพ่อ",
  "12-10": "วันรัฐธรรมนูญ",
  "12-31": "วันสิ้นปี"
};

/* ============================================================
   HELPERS
============================================================ */

function formatNumber(num) {
  return Number(num).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function getHoliday(month, day) {
  const key = `${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return thaiHolidays[key] || null;
}

function populateMonthYear() {
    const monthSelect = document.getElementById("month-select");
    const yearSelect = document.getElementById("year-select");

    // ใส่ชื่อเดือน
    monthSelect.innerHTML = thaiMonths.map((m, i) =>
        `<option value="${i}">${m}</option>`
    ).join("");

    // ใส่ปีย้อนหลังและล่วงหน้า
    const yearMin = 2020;
    const yearMax = 2035;
    let options = "";
    for (let y = yearMin; y <= yearMax; y++) {
        options += `<option value="${y}">${y + 543}</option>`;
    }
    yearSelect.innerHTML = options;

    // ตั้งค่าเริ่มต้น เป็นเดือนปีปัจจุบัน
    monthSelect.value = currentMonth;
    yearSelect.value = currentYear;

    // event เปลี่ยนเดือน
    monthSelect.onchange = () => {
        currentMonth = Number(monthSelect.value);
        renderCalendar();
    };

    // event เปลี่ยนปี
    yearSelect.onchange = () => {
        currentYear = Number(yearSelect.value);
        renderCalendar();
    };
}

function syncDropdown() {
    document.getElementById("month-select").value = currentMonth;
    document.getElementById("year-select").value = currentYear;
}


/* ============================================================
   AGGREGATE PAYMENTS BY DATE
============================================================ */
function aggregatePaymentsByDate() {
  const aggregated = {};

  paymentData.forEach(item => {
    const d = item.due_date;
    if (!(d instanceof Date) || isNaN(d)) return;

    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    if (!aggregated[key]) {
      aggregated[key] = {
        countAll: 0,
        countDiff: 0,
        items: []
      };
    }

    /* ==========================
       ทั้งหมด (Col E)
    ========================== */
    if (item.colE !== "") {
      aggregated[key].countAll++;
      aggregated[key].items.push({
        type: "all",
        code: item.code,
        description: item.description,
        qty: item.qty,
        remark: item.remarkAll     // ✅ remark ปกติ
      });
    }

    /* ==========================
       Diff (Col P)
    ========================== */
    if (item.colP !== "") {
      aggregated[key].countDiff++;
      aggregated[key].items.push({
        type: "diff",
        code: item.code,
        description: item.description,
        qty: item.qty,
        remark: item.remarkDiff    // ✅ ดึง Col O
      });
    }
  });

  return aggregated;
}



/* ============================================================
   RENDER CALENDAR
============================================================ */

function renderCalendar() {
  const grid = document.getElementById("calendar-grid");
  grid.innerHTML = "";

  const headers = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
  headers.forEach((h, i) => {
    const el = document.createElement("div");
    el.className = "day-header" + (i === 0 ? " sunday" : "");
    el.innerText = h;
    grid.appendChild(el);
  });

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const data = aggregatePaymentsByDate();

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    empty.className = "day-cell empty";
    grid.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(currentYear, currentMonth, d);
    const key = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    const cell = document.createElement("div");
    cell.className = "day-cell";

    if (date.getDay() === 0) cell.classList.add("sunday");
    if (date.getDay() === 6) cell.classList.add("saturday");

    const holiday = getHoliday(currentMonth, d);
    if (holiday) cell.classList.add("holiday");

    const num = document.createElement("div");
    num.className = "day-number";
    num.innerText = d;
    cell.appendChild(num);

    const hname = document.createElement("div");
    hname.className = "holiday-name";
    hname.innerText = holiday ? holiday : "";
    cell.appendChild(hname);


      const info = data[key];
      const countAll = info ? info.countAll : 0;
      const countDiff = info ? info.countDiff : 0;

      const cnt = document.createElement("div");
      cnt.className = "payment-count";
      cnt.innerText =
        countAll > 0 || countDiff > 0
          ? `All ${countAll} | Pending ${countDiff}`
          : "";
      cell.appendChild(cnt);



    if (info && info.items.length > 0) {
      cell.addEventListener("click", () => showModal(key, info));
      cell.classList.add("clickable");
    }


    grid.appendChild(cell);
  }

  updateHeader();
}

function updateHeader() {
  document.getElementById("month-year-display").innerText =
    `${thaiMonths[currentMonth]} ${currentYear + 543}`;
}

/* ============================================================
   MODAL
============================================================ */

function showModal(key, info) {
  if (!info || !info.items || info.items.length === 0) return;

  const modal = document.getElementById("transaction-modal");
  const list = document.getElementById("transaction-list");
  const title = document.getElementById("modal-date-title");

  const btnAll = document.getElementById("btn-all");
  const btnDiff = document.getElementById("btn-diff");

  const [year, month, day] = key.split("-");
  const holiday = getHoliday(parseInt(month) - 1, parseInt(day));

  title.innerHTML =
    `${parseInt(day)} ${thaiMonths[parseInt(month) - 1]} ${parseInt(year) + 543}` +
    (holiday ? ` <span class="holiday-tag">(${holiday})</span>` : "");

  // แยกข้อมูล
  modalAllItems  = info.items.filter(i => i.type === "all");
  modalDiffItems = info.items.filter(i => i.type === "diff");

  // reset ปุ่ม
  btnAll.classList.add("active");
  btnDiff.classList.remove("active");

  // แสดง "ทั้งหมด" เป็นค่าเริ่มต้น
  renderModalItems(modalAllItems);

  // event ปุ่ม
  btnAll.onclick = () => {
    btnAll.classList.add("active");
    btnDiff.classList.remove("active");
    renderModalItems(modalAllItems);
  };

  btnDiff.onclick = () => {
    btnDiff.classList.add("active");
    btnAll.classList.remove("active");
    renderModalItems(modalDiffItems);
  };

  modal.classList.add("active");
}

function renderModalItems(items) {
  const list = document.getElementById("transaction-list");
  list.innerHTML = "";

  if (items.length === 0) {
    list.innerHTML = `<div class="no-data">ไม่มีข้อมูล (เปิด PO ครบทุกรายการแล้ว)</div>`;
    return;
  }

  items.forEach(item => {
    const el = document.createElement("div");
    el.className = "transaction-item";
    el.innerHTML = `
      <div class="transaction-row"><b>Item Code:</b> ${item.code}</div>
      <div class="transaction-row mono"><b>Description:</b> ${item.description}</div>
      <div class="transaction-row mono"><b>Qty:</b> ${item.qty}</div>
      <div class="transaction-row mono"><b>Remark:</b> ${item.remark}</div>
    `;
    list.appendChild(el);
  });
}


document.getElementById("close-modal").addEventListener("click", () => {
  document.getElementById("transaction-modal").classList.remove("active");
});

/* ============================================================
   LOAD DATA FROM GOOGLE SHEETS (GVIZ)
============================================================ */
function convertGVizDate(cell, fallbackDate = null) {
    // -----------------------------------
    // 0) ถ้า cell เป็น null/ว่าง -> ใช้ fallback
    // -----------------------------------
    if (cell == null || cell === "") return fallbackDate;

    // -----------------------------------
    // 1) ถ้าเป็น error (#VALUE! เป็นต้น)
    // -----------------------------------
    if (typeof cell === "string" && cell.includes("#")) return fallbackDate;

    if (typeof cell === "object") {

        // 1A: ถ้า cell.f เป็นวันที่ เช่น "12/03/2568"
        if (cell.f && typeof cell.f === "string" && cell.f.includes("/")) {
            return parseDateString(cell.f);
        }

        // 1B: ถ้า cell.v เป็นวันที่แบบ "12/03/2568"
        if (cell.v && typeof cell.v === "string" && cell.v.includes("/")) {
            return parseDateString(cell.v);
        }

        // 1C: ถ้า cell.v เป็น Date(...)
        if (cell.v && typeof cell.v === "string" && cell.v.startsWith("Date(")) {
            return convertGVizDate(cell.v, fallbackDate);
        }

        return fallbackDate;
    }

    // -----------------------------------
    // 2) รูปแบบ Date(2568,2,12)
    // -----------------------------------
    if (typeof cell === "string" && cell.startsWith("Date(")) {
        const nums = cell.replace("Date(", "").replace(")", "").split(",");
        let year = Number(nums[0]);
        let month = Number(nums[1]);
        let day = Number(nums[2]);

        // แปลง พ.ศ. → ค.ศ.
        if (year > 2400) year -= 543;

        return new Date(year, month, day);
    }

    // -----------------------------------
    // 3) รูปแบบ DD/MM/YYYY (ทั้ง พ.ศ. และ ค.ศ.)
    // -----------------------------------
    if (typeof cell === "string" && cell.includes("/")) {
        return parseDateString(cell);
    }

    // -----------------------------------
    // 4) Serial Number (กรณีดึงข้อมูลเป็นตัวเลข)
    // -----------------------------------
    if (typeof cell === "number") {
        const base = new Date(1899, 11, 30); 
        return new Date(base.getTime() + cell * 86400000);
    }

    return fallbackDate;
}
function parseDateString(str) {
    if (!str || typeof str !== "string") return null;

    const parts = str.trim().split("/");
    if (parts.length !== 3) return null;

    let day = parseInt(parts[0]);
    let month = parseInt(parts[1]);
    let year = parseInt(parts[2]);

    if (!day || !month || !year) return null;

    // ถ้าเป็นปี พ.ศ.
    if (year > 2400) year -= 543;

    return new Date(year, month - 1, day);
}


async function loadData() {
  const url =
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;

  try {
    const res = await fetch(url);
    const text = await res.text();

    const json = JSON.parse(text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1));

    const rows = json.table.rows;
    window._rows = rows;   // ← ทำให้ rows ใช้งานจาก Console ได้


    console.log(
  "SAMPLE NON-NULL DUE_DATE:",
  rows
    .map(r => r.c[9])
    .filter(x => x !== null)
    .slice(0, 20)
);

    // 🟩 Mapping ตรงกับชีตจริง 100%
    paymentData = rows.map(r => {

      let prDate = convertGVizDate(r.c[0]);   // Date PR

      return {
        date: prDate,
        due_date: prDate,   // ใช้ Date PR เป็นวันที่แสดงใน Calendar

        code: r.c[1]?.v || "-",          // xxx-yyy-zzzz
        description: r.c[2]?.v || "-",   // Description
        qty: r.c[3]?.v || "-",           // เสนอซื้อ

        remarkAll: r.c[4]?.v || "-",     // Remark (ทั้งหมด)
        remarkDiff: r.c[6]?.v || "",     // Remark (PO Pending)

        colE: r.c[1]?.v || "",            // ใช้เช็ค All
        colP: r.c[7]?.v || ""             // ใช้เช็ค PO Pending
      };
    });


    console.log("Loaded Payment Data:", paymentData);

    renderCalendar();

  } catch (err) {
    console.error("ERROR loading sheet:", err);
    alert("โหลดข้อมูลจาก Google Sheet ไม่สำเร็จ\nตรวจสอบการแชร์ไฟล์ให้เป็น Anyone with link → Viewer");
  }
}

/* ============================================================
   MONTH NAVIGATION
============================================================ */

document.getElementById("prev-month").onclick = () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    syncDropdown();
    renderCalendar();
};


document.getElementById("next-month").onclick = () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    syncDropdown();
    renderCalendar();
};

function bindCalendarControls() {

    const prev = document.getElementById("prev-month");
    const next = document.getElementById("next-month");
    const close = document.getElementById("close-modal");

    if (prev) {
        prev.onclick = () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            syncDropdown();
            renderCalendar();
        };
    }

    if (next) {
        next.onclick = () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            syncDropdown();
            renderCalendar();
        };
    }

    if (close) {
        close.addEventListener("click", () => {
            document
                .getElementById("transaction-modal")
                ?.classList.remove("active");
        });
    }
}

/* ============================================================
   INITIAL LOAD
============================================================ */

function initCalendar() {
    if (window.calendarInitialized) return;

    populateMonthYear();
    bindCalendarControls();
    loadData();

    window.calendarInitialized = true;
}
window.addEventListener("DOMContentLoaded", initCalendar);
