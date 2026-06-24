"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var BoxCalculation;
(function (BoxCalculation) {
    function parseValue(input) {
        const value = parseFloat(input.value);
        return Number.isFinite(value) ? value : 0;
    }
    function formatTotal(total) {
        return Number(total.toFixed(2)).toString();
    }
    function showToast(message, kind) {
        const container = document.getElementById("toastContainer");
        if (!container) {
            return;
        }
        const bg = kind === "success" ? "text-bg-success" : "text-bg-danger";
        const icon = kind === "success" ? "bi-check-circle" : "bi-exclamation-triangle";
        const toast = document.createElement("div");
        toast.className = `toast align-items-center ${bg} border-0`;
        toast.setAttribute("role", "alert");
        toast.setAttribute("aria-live", "assertive");
        toast.setAttribute("aria-atomic", "true");
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body"><i class="bi ${icon} me-2"></i>${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto"
                        data-bs-dismiss="toast" aria-label="Close"></button>
            </div>`;
        container.appendChild(toast);
        const w = window;
        if (w.bootstrap && w.bootstrap.Toast) {
            const instance = new w.bootstrap.Toast(toast, { delay: 4000 });
            toast.addEventListener("hidden.bs.toast", () => toast.remove());
            instance.show();
        }
        else {
            window.setTimeout(() => toast.remove(), 4000);
        }
    }
    class BoxTable {
        constructor() {
            this.loadedOrderCode = "";
            this.orderCode = this.require("orderCode");
            this.fetchBtn = this.require("fetchDataBtn");
            this.addRowBtn = this.require("boxAddRowBtn");
            this.saveBtn = this.require("saveDataBtn");
            this.panel = this.require("boxPanel");
            this.tableBody = this.require("boxTableBody");
            this.totalBox = this.require("totalBox");
            this.totalBoxKg = this.require("totalBoxKg");
            this.rowCount = this.require("boxRowCount");
        }
        init() {
            this.fetchBtn.addEventListener("click", () => void this.fetchData());
            this.orderCode.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    void this.fetchData();
                }
            });
            this.addRowBtn.addEventListener("click", () => this.addRow());
            this.saveBtn.addEventListener("click", () => void this.saveData());
            this.tableBody.addEventListener("input", () => this.recalculate());
            this.tableBody.addEventListener("click", (e) => {
                var _a;
                const removeBtn = e.target.closest(".box-row__remove");
                if (removeBtn) {
                    (_a = removeBtn.closest("tr")) === null || _a === void 0 ? void 0 : _a.remove();
                    this.renumberRows();
                    this.recalculate();
                }
            });
        }
        fetchData() {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                const code = this.orderCode.value.trim();
                if (!code) {
                    showToast("Vui lòng nhập mã đơn hàng.", "error");
                    return;
                }
                try {
                    const url = `/Admin/GetBoxData?orderCode=${encodeURIComponent(code)}`;
                    const res = yield fetch(url, { headers: { "Accept": "application/json" } });
                    const data = yield res.json();
                    if (!data.success) {
                        this.panel.classList.add("d-none");
                        showToast(data.message, "error");
                        return;
                    }
                    this.loadedOrderCode = code;
                    this.renderRows((_a = data.boxes) !== null && _a !== void 0 ? _a : []);
                    this.panel.classList.remove("d-none");
                    showToast(data.message, "success");
                }
                catch (_b) {
                    showToast("Không thể kết nối tới máy chủ.", "error");
                }
            });
        }
        renderRows(boxes) {
            this.tableBody.innerHTML = "";
            if (boxes.length === 0) {
                this.addRow();
                return;
            }
            boxes.forEach((b) => this.addRow(b.boxNubmer, b.boxWeight));
            this.recalculate();
        }
        addRow(boxNubmer, boxWeight) {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td class="box-row__index"></td>
                <td>
                    <input type="number" class="form-control box-input box-number"
                           min="0" step="1" placeholder="0" aria-label="Số Lồng"
                           value="${boxNubmer !== null && boxNubmer !== void 0 ? boxNubmer : ""}" />
                </td>
                <td>
                    <input type="number" class="form-control box-input box-weight"
                           min="0" step="any" placeholder="0" aria-label="Số Ký"
                           value="${boxWeight !== null && boxWeight !== void 0 ? boxWeight : ""}" />
                </td>
                <td>
                    <button type="button" class="btn btn-sm btn-outline-danger box-row__remove"
                            aria-label="Xóa dòng" title="Xóa dòng">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>`;
            this.tableBody.appendChild(row);
            this.renumberRows();
            this.recalculate();
        }
        renumberRows() {
            const rows = this.tableBody.rows;
            for (let i = 0; i < rows.length; i++) {
                const cell = rows[i].cells[0];
                if (cell) {
                    cell.textContent = (i + 1).toString();
                }
            }
            this.rowCount.textContent = rows.length.toString();
        }
        recalculate() {
            let boxTotal = 0;
            let weightTotal = 0;
            this.tableBody.querySelectorAll(".box-number")
                .forEach((input) => (boxTotal += parseValue(input)));
            this.tableBody.querySelectorAll(".box-weight")
                .forEach((input) => (weightTotal += parseValue(input)));
            this.totalBox.value = formatTotal(boxTotal);
            this.totalBoxKg.value = formatTotal(weightTotal);
        }
        saveData() {
            return __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                if (!this.loadedOrderCode) {
                    showToast("Vui lòng tải dữ liệu đơn hàng trước khi lưu.", "error");
                    return;
                }
                const rows = [];
                let invalid = false;
                this.tableBody.querySelectorAll("tr").forEach((tr, index) => {
                    const numberInput = tr.querySelector(".box-number");
                    const weightInput = tr.querySelector(".box-weight");
                    if (!numberInput || !weightInput) {
                        return;
                    }
                    const boxNubmer = parseValue(numberInput);
                    const boxWeight = parseValue(weightInput);
                    if (boxNubmer < 0 || boxWeight < 0) {
                        invalid = true;
                    }
                    rows.push({ stt: index + 1, boxNubmer, boxWeight });
                });
                if (invalid) {
                    showToast("Giá trị Số Lồng / Số Ký không được âm.", "error");
                    return;
                }
                const token = (_b = (_a = document.querySelector('input[name="__RequestVerificationToken"]')) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : "";
                try {
                    this.saveBtn.disabled = true;
                    const res = yield fetch("/Admin/SaveBoxData", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json",
                            "RequestVerificationToken": token
                        },
                        body: JSON.stringify({ orderCode: this.loadedOrderCode, rows })
                    });
                    const data = yield res.json();
                    if (data.success) {
                        if (typeof data.totalBox === "number") {
                            this.totalBox.value = formatTotal(data.totalBox);
                        }
                        if (typeof data.totalBoxKg === "number") {
                            this.totalBoxKg.value = formatTotal(data.totalBoxKg);
                        }
                        showToast(data.message, "success");
                    }
                    else {
                        showToast(data.message, "error");
                    }
                }
                catch (_c) {
                    showToast("Không thể lưu dữ liệu. Vui lòng thử lại.", "error");
                }
                finally {
                    this.saveBtn.disabled = false;
                }
            });
        }
        require(id) {
            const el = document.getElementById(id);
            if (!el) {
                throw new Error(`BoxCalculation: missing element #${id}`);
            }
            return el;
        }
    }
    document.addEventListener("DOMContentLoaded", () => {
        if (document.getElementById("boxTableBody")) {
            new BoxTable().init();
        }
    });
})(BoxCalculation || (BoxCalculation = {}));
var DuckCalculation;
(function (DuckCalculation) {
    const CODE_COUNT = 5;
    const CODE_MAX_DIGITS = 5;
    const GLOBAL_MAX_DIGITS = 2;
    function parseValue(input) {
        const value = parseFloat(input.value);
        return Number.isFinite(value) ? value : 0;
    }
    function isFilled(input) {
        return input.value.trim() !== "";
    }
    function limitDigits(input, maxDigits) {
        if (input.value.length > maxDigits) {
            input.value = input.value.slice(0, maxDigits);
        }
    }
    function formatTotal(total) {
        return Number(total.toFixed(2)).toString();
    }
    class DuckTable {
        constructor() {
            this.tableBody = this.require("duckTableBody");
            this.addRowBtn = this.require("duckAddRowBtn");
            this.ducksPerCage = this.require("ducksPerCage");
            this.cagesPerWeighing = this.require("cagesPerWeighing");
            this.totalWeight = this.require("totalWeight");
            this.totalDucks = this.require("totalDucks");
            this.rowCount = this.require("duckRowCount");
        }
        init() {
            this.addRowBtn.addEventListener("click", () => this.addRow());
            this.tableBody.addEventListener("input", (e) => {
                const target = e.target;
                if (target.classList.contains("duck-code")) {
                    limitDigits(target, CODE_MAX_DIGITS);
                }
                this.recalculate();
            });
            this.tableBody.addEventListener("click", (e) => {
                var _a;
                const removeBtn = e.target.closest(".duck-row__remove");
                if (removeBtn) {
                    (_a = removeBtn.closest("tr")) === null || _a === void 0 ? void 0 : _a.remove();
                    this.renumberRows();
                    this.recalculate();
                }
            });
            [this.ducksPerCage, this.cagesPerWeighing].forEach((input) => {
                input.addEventListener("input", () => {
                    limitDigits(input, GLOBAL_MAX_DIGITS);
                    this.recalculate();
                });
            });
            this.addRow();
        }
        addRow() {
            var _a;
            const row = document.createElement("tr");
            let codeCells = "";
            for (let i = 1; i <= CODE_COUNT; i++) {
                codeCells += `
                <td>
                    <input type="number" class="form-control duck-input duck-code"
                           min="0" step="1" placeholder="0" aria-label="Mã ${i}" />
                </td>`;
            }
            row.innerHTML = `
                <td class="duck-row__index">
                    <span class="duck-row__no"></span>
                    <button type="button" class="btn btn-sm btn-outline-danger duck-row__remove"
                            aria-label="Xóa dòng" title="Xóa dòng">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
                ${codeCells}
                <td class="duck-row__weight">0</td>
                <td class="duck-row__ducks">0</td>`;
            this.tableBody.appendChild(row);
            this.renumberRows();
            this.recalculate();
            (_a = row.querySelector(".duck-code")) === null || _a === void 0 ? void 0 : _a.focus();
        }
        renumberRows() {
            const rows = this.tableBody.rows;
            for (let i = 0; i < rows.length; i++) {
                const noCell = rows[i].querySelector(".duck-row__no");
                if (noCell) {
                    noCell.textContent = (i + 1).toString();
                }
            }
            this.rowCount.textContent = rows.length.toString();
        }
        recalculate() {
            const perCage = parseValue(this.ducksPerCage);
            const perWeighing = parseValue(this.cagesPerWeighing);
            const ducksPerFilledCode = perCage * perWeighing;
            let grandWeight = 0;
            let grandDucks = 0;
            const rows = this.tableBody.rows;
            for (let i = 0; i < rows.length; i++) {
                const codes = rows[i].querySelectorAll(".duck-code");
                let rowWeight = 0;
                let filledCount = 0;
                codes.forEach((code) => {
                    rowWeight += parseValue(code);
                    if (isFilled(code)) {
                        filledCount++;
                    }
                });
                const rowDucks = ducksPerFilledCode * filledCount;
                const weightCell = rows[i].querySelector(".duck-row__weight");
                const ducksCell = rows[i].querySelector(".duck-row__ducks");
                if (weightCell) {
                    weightCell.textContent = formatTotal(rowWeight);
                }
                if (ducksCell) {
                    ducksCell.textContent = formatTotal(rowDucks);
                }
                grandWeight += rowWeight;
                grandDucks += rowDucks;
            }
            this.totalWeight.value = formatTotal(grandWeight);
            this.totalDucks.value = formatTotal(grandDucks);
        }
        require(id) {
            const el = document.getElementById(id);
            if (!el) {
                throw new Error(`DuckCalculation: missing element #${id}`);
            }
            return el;
        }
    }
    document.addEventListener("DOMContentLoaded", () => {
        if (document.getElementById("duckTableBody")) {
            new DuckTable().init();
        }
    });
})(DuckCalculation || (DuckCalculation = {}));
var CageCalculation;
(function (CageCalculation) {
    function parseValue(input) {
        const value = parseFloat(input.value);
        return Number.isFinite(value) ? value : 0;
    }
    function formatTotal(total) {
        return Number(total.toFixed(2)).toString();
    }
    class CageTable {
        constructor() {
            this.tableBody = this.require("cageTableBody");
            this.addRowBtn = this.require("addRowBtn");
            this.totalCageNumber = this.require("totalCageNumber");
            this.totalWeight = this.require("totalWeight");
            this.rowCount = this.require("rowCount");
        }
        init() {
            this.addRowBtn.addEventListener("click", () => this.addRow());
            this.tableBody.addEventListener("input", () => this.recalculate());
            this.tableBody.addEventListener("click", (e) => {
                var _a;
                const target = e.target;
                const removeBtn = target.closest(".cage-row__remove");
                if (removeBtn) {
                    (_a = removeBtn.closest("tr")) === null || _a === void 0 ? void 0 : _a.remove();
                    this.renumberRows();
                    this.recalculate();
                }
            });
            this.addRow();
        }
        addRow() {
            var _a;
            const index = this.tableBody.rows.length + 1;
            const row = document.createElement("tr");
            row.innerHTML = `
                <td class="cage-row__index">${index}</td>
                <td>
                    <input type="number" class="form-control cage-input cage-cage-number"
                           min="0" step="1" placeholder="0" aria-label="Cage number"  />
                </td>
                <td>
                    <input type="number" class="form-control cage-input cage-weight"
                           min="0" step="any" placeholder="0" aria-label="Weight"/>
                </td>
                <td>
                    <button type="button" class="btn btn-outline-danger cage-row__remove"
                            aria-label="Remove row" title="Xóa dòng">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>`;
            this.tableBody.appendChild(row);
            this.renumberRows();
            (_a = row.querySelector(".cage-cage-number")) === null || _a === void 0 ? void 0 : _a.focus();
        }
        renumberRows() {
            const rows = this.tableBody.rows;
            for (let i = 0; i < rows.length; i++) {
                const cell = rows[i].cells[0];
                if (cell) {
                    cell.textContent = (i + 1).toString();
                }
            }
            this.rowCount.textContent = rows.length.toString();
        }
        recalculate() {
            let cageTotal = 0;
            let weightTotal = 0;
            this.tableBody
                .querySelectorAll(".cage-cage-number")
                .forEach((input) => (cageTotal += parseValue(input)));
            this.tableBody
                .querySelectorAll(".cage-weight")
                .forEach((input) => (weightTotal += parseValue(input)));
            this.totalCageNumber.value = formatTotal(cageTotal);
            this.totalWeight.value = formatTotal(weightTotal);
        }
        require(id) {
            const el = document.getElementById(id);
            if (!el) {
                throw new Error(`CageCalculation: missing element #${id}`);
            }
            return el;
        }
    }
    document.addEventListener("DOMContentLoaded", () => {
        if (document.getElementById("cageTableBody")) {
            new CageTable().init();
        }
    });
})(CageCalculation || (CageCalculation = {}));
var SidebarNav;
(function (SidebarNav) {
    const OPEN_CLASS = "is-open";
    const OVERLAY_VISIBLE_CLASS = "is-visible";
    const BODY_OPEN_CLASS = "sidebar-open";
    class Sidebar {
        constructor(sidebar, overlay, toggleBtn) {
            this.sidebar = sidebar;
            this.overlay = overlay;
            this.toggleBtn = toggleBtn;
        }
        init() {
            this.toggleBtn.addEventListener("click", () => this.toggle());
            this.overlay.addEventListener("click", () => this.close());
            this.sidebar.querySelectorAll(".sidebar-link").forEach((link) => {
                link.addEventListener("click", () => this.close());
            });
            document.addEventListener("keydown", (e) => {
                if (e.key === "Escape") {
                    this.close();
                }
            });
            this.highlightActiveLink();
        }
        toggle() {
            this.sidebar.classList.contains(OPEN_CLASS) ? this.close() : this.open();
        }
        open() {
            this.sidebar.classList.add(OPEN_CLASS);
            this.overlay.classList.add(OVERLAY_VISIBLE_CLASS);
            document.body.classList.add(BODY_OPEN_CLASS);
            this.toggleBtn.setAttribute("aria-expanded", "true");
        }
        close() {
            this.sidebar.classList.remove(OPEN_CLASS);
            this.overlay.classList.remove(OVERLAY_VISIBLE_CLASS);
            document.body.classList.remove(BODY_OPEN_CLASS);
            this.toggleBtn.setAttribute("aria-expanded", "false");
        }
        highlightActiveLink() {
            const currentPath = this.normalize(window.location.pathname);
            const links = Array.from(this.sidebar.querySelectorAll(".sidebar-link"));
            let best = null;
            let bestLength = -1;
            for (const link of links) {
                const linkPath = this.normalize(new URL(link.href).pathname);
                const isMatch = linkPath === currentPath ||
                    (linkPath !== "/" && currentPath.indexOf(linkPath + "/") === 0);
                if (isMatch && linkPath.length > bestLength) {
                    best = link;
                    bestLength = linkPath.length;
                }
            }
            if (best) {
                best.classList.add("active");
            }
        }
        normalize(path) {
            const lower = path.toLowerCase();
            return lower.length > 1 && lower.endsWith("/") ? lower.slice(0, -1) : lower;
        }
    }
    document.addEventListener("DOMContentLoaded", () => {
        const sidebar = document.getElementById("appSidebar");
        const overlay = document.getElementById("sidebarOverlay");
        const toggleBtn = document.getElementById("sidebarToggle");
        if (sidebar && overlay && toggleBtn) {
            new Sidebar(sidebar, overlay, toggleBtn).init();
        }
    });
})(SidebarNav || (SidebarNav = {}));
//# sourceMappingURL=export-calculation.js.map