// duckCalculationPage.js
// Fetch + Save logic for Views/Admin/DuckCalculationPage.cshtml.
// Talks to AdminController.GetDuckData / SaveDuckData via the fetch API.
// The auto-calculation of the table/summary is handled separately by
// export-calculation.js (DuckTable); this file only adds order lookup + save.
(function () {
    "use strict";

    // ---- Endpoints ----
    var FETCH_URL = "/Admin/GetDuckData";
    var SAVE_URL = "/Admin/SaveDuckData";

    // ---- Element ids (mapped to their model fields) ----
    var IDS = {
        orderCode: "orderCodeDuckPage",       // OrderModel.OrderCode
        totalDuckinBox: "ducksPerCage",       // OrderModel.totalDuckinBox
        totalBoxInOneTime: "cagesPerWeighing",// OrderModel.totalBoxInOneTime
        boxWeight: "totalBoxKg",              // OrderModel.totalBoxKg
        decreaseDuck: "someInput1",           // OrderModel.decreaseDuck
        currency: "someInput2",               // OrderModel.currency
        fetchBtn: "fetchDataBtnDuckPage",
        saveBtn: "saveDataBtnDuckPage"
    };

    // ---- Small DOM helpers ------------------------------------------------

    function byId(id) {
        return document.getElementById(id);
    }

    function getValue(id) {
        var el = byId(id);
        return el ? String(el.value).trim() : "";
    }

    function setValue(id, value) {
        var el = byId(id);
        if (!el) {
            return;
        }
        el.value = (value === null || value === undefined) ? "" : value;
        // Let export-calculation.js recompute totals for the listening inputs.
        el.dispatchEvent(new Event("input", { bubbles: true }));
    }

    // The 5 "Mã" inputs live in the first row of the duck table.
    function getCodeInputs() {
        var body = byId("duckTableBody");
        if (!body) {
            return [];
        }
        var firstRow = body.querySelector("tr");
        if (!firstRow) {
            return [];
        }
        return Array.prototype.slice.call(firstRow.querySelectorAll(".duck-code")).slice(0, 5);
    }

    function setCodeValue(index, value) {
        var inputs = getCodeInputs();
        var input = inputs[index];
        if (!input) {
            return;
        }
        input.value = (value === null || value === undefined) ? "" : value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
    }

    // Parse a numeric field; returns null when empty, NaN when invalid.
    function parseNumber(id) {
        var raw = getValue(id);
        if (raw === "") {
            return null;
        }
        var n = Number(raw);
        return Number.isFinite(n) ? n : NaN;
    }

    function parseCode(input) {
        var raw = input && input.value ? String(input.value).trim() : "";
        if (raw === "") {
            return 0;
        }
        var n = Number(raw);
        return Number.isFinite(n) ? n : NaN;
    }

    // ---- Toast ------------------------------------------------------------

    // kind: "success" | "warning" | "error"
    function showToast(message, kind) {
        var container = byId("toastContainer");
        if (!container) {
            return;
        }
        var bg = "text-bg-danger";
        var icon = "bi-exclamation-triangle";
        if (kind === "success") {
            bg = "text-bg-success";
            icon = "bi-check-circle";
        } else if (kind === "warning") {
            bg = "text-bg-warning";
            icon = "bi-exclamation-circle";
        }

        var toast = document.createElement("div");
        toast.className = "toast align-items-center " + bg + " border-0";
        toast.setAttribute("role", "alert");
        toast.setAttribute("aria-live", "assertive");
        toast.setAttribute("aria-atomic", "true");
        toast.innerHTML =
            '<div class="d-flex">' +
                '<div class="toast-body"><i class="bi ' + icon + ' me-2"></i>' + message + "</div>" +
                '<button type="button" class="btn-close btn-close-white me-2 m-auto" ' +
                    'data-bs-dismiss="toast" aria-label="Close"></button>' +
            "</div>";
        container.appendChild(toast);

        if (window.bootstrap && window.bootstrap.Toast) {
            var instance = new window.bootstrap.Toast(toast, { delay: 4000 });
            toast.addEventListener("hidden.bs.toast", function () { toast.remove(); });
            instance.show();
        } else {
            window.setTimeout(function () { toast.remove(); }, 4000);
        }
    }

    // ---- Button loading state --------------------------------------------

    function setButtonLoading(btn, isLoading, loadingText) {
        if (!btn) {
            return;
        }
        if (isLoading) {
            if (!btn.dataset.originalValue) {
                btn.dataset.originalValue = btn.value;
            }
            btn.disabled = true;
            btn.value = loadingText || "Đang xử lý...";
        } else {
            btn.disabled = false;
            if (btn.dataset.originalValue) {
                btn.value = btn.dataset.originalValue;
                delete btn.dataset.originalValue;
            }
        }
    }

    // ---- Validation -------------------------------------------------------

    function validateFetch() {
        var code = getValue(IDS.orderCode);
        if (!code) {
            showToast("Vui lòng nhập mã đơn hàng.", "warning");
            return false;
        }
        return true;
    }

    function validateSave() {
        if (!getValue(IDS.orderCode)) {
            showToast("Vui lòng nhập mã đơn hàng.", "warning");
            return false;
        }

        // OrderModel numeric fields: must be numeric and >= 0 when provided.
        var numericChecks = [
            { id: IDS.totalDuckinBox, label: "Số con vịt trong lồng" },
            { id: IDS.totalBoxInOneTime, label: "Số lồng 1 lần cân" },
            { id: IDS.boxWeight, label: "Tổng số ký lồng" },
            { id: IDS.decreaseDuck, label: "Số vịt trừ" },
            { id: IDS.currency, label: "Giá vịt xuất" }
        ];

        for (var i = 0; i < numericChecks.length; i++) {
            var value = parseNumber(numericChecks[i].id);
            if (Number.isNaN(value)) {
                showToast(numericChecks[i].label + " phải là số hợp lệ.", "warning");
                return false;
            }
            if (value !== null && value < 0) {
                showToast(numericChecks[i].label + " không được âm.", "warning");
                return false;
            }
        }

        // Code fields (optional) must still be numeric and >= 0 when present.
        var codeInputs = getCodeInputs();
        for (var c = 0; c < codeInputs.length; c++) {
            var codeVal = parseCode(codeInputs[c]);
            if (Number.isNaN(codeVal) || codeVal < 0) {
                showToast("Mã " + (c + 1) + " phải là số hợp lệ và không âm.", "warning");
                return false;
            }
        }

        return true;
    }

    // ---- Form data mapping ------------------------------------------------

    function collectFormData() {
        var codeInputs = getCodeInputs();
        return {
            orderCode: getValue(IDS.orderCode),
            totalDuckinBox: parseNumber(IDS.totalDuckinBox),
            totalBoxInOneTime: parseNumber(IDS.totalBoxInOneTime),
            boxWeight: parseNumber(IDS.boxWeight),
            decreaseDuck: parseNumber(IDS.decreaseDuck),
            currency: parseNumber(IDS.currency),
            code1: codeInputs[0] ? parseCode(codeInputs[0]) : 0,
            code2: codeInputs[1] ? parseCode(codeInputs[1]) : 0,
            code3: codeInputs[2] ? parseCode(codeInputs[2]) : 0,
            code4: codeInputs[3] ? parseCode(codeInputs[3]) : 0,
            code5: codeInputs[4] ? parseCode(codeInputs[4]) : 0
        };
    }

    function populateFormData(data) {
        setValue(IDS.totalDuckinBox, data.totalDuckinBox);
        setValue(IDS.totalBoxInOneTime, data.totalBoxInOneTime);
        setValue(IDS.boxWeight, data.BoxWeight);
        setValue(IDS.decreaseDuck, data.decreaseDuck);
        setValue(IDS.currency, data.currency);
        setCodeValue(0, data.code1);
        setCodeValue(1, data.code2);
        setCodeValue(2, data.code3);
        setCodeValue(3, data.code4);
        setCodeValue(4, data.code5);
    }

    function getAntiForgeryToken() {
        var input = document.querySelector('input[name="__RequestVerificationToken"]');
        return input ? input.value : "";
    }

    // ---- Fetch Data -------------------------------------------------------

    function fetchData() {
        if (!validateFetch()) {
            return;
        }

        var fetchBtn = byId(IDS.fetchBtn);
        var code = getValue(IDS.orderCode);
        setButtonLoading(fetchBtn, true, "Đang tải...");

        fetch(FETCH_URL + "?orderCode=" + encodeURIComponent(code), {
            headers: { "Accept": "application/json" }
        })
            .then(function (res) {
                if (!res.ok) {
                    throw new Error("HTTP " + res.status);
                }
                return res.json();
            })
            .then(function (data) {
                if (!data || !data.success) {
                    showToast(data && data.message ? data.message : "Không tìm thấy dữ liệu.", "warning");
                    return;
                }
                populateFormData(data);
                showToast(data.message || "Đã tải dữ liệu thành công.", "success");
            })
            .catch(function () {
                showToast("Không thể kết nối tới máy chủ. Vui lòng thử lại.", "error");
            })
            .finally(function () {
                setButtonLoading(fetchBtn, false);
            });
    }

    // ---- Save Data --------------------------------------------------------

    function saveData() {
        if (!validateSave()) {
            return;
        }

        var saveBtn = byId(IDS.saveBtn);
        var payload = collectFormData();
        setButtonLoading(saveBtn, true, "Đang lưu...");

        fetch(SAVE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "RequestVerificationToken": getAntiForgeryToken()
            },
            body: JSON.stringify({
                orderCode: payload.orderCode,
                totalDuckinBox: payload.totalDuckinBox,
                totalBoxInOneTime: payload.totalBoxInOneTime,
                BoxWeight: payload.boxWeight,
                decreaseDuck: payload.decreaseDuck,
                currency: payload.currency,
                code1: payload.code1,
                code2: payload.code2,
                code3: payload.code3,
                code4: payload.code4,
                code5: payload.code5
            })
        })
            .then(function (res) {
                if (!res.ok) {
                    throw new Error("HTTP " + res.status);
                }
                return res.json();
            })
            .then(function (data) {
                if (data && data.success) {
                    showToast(data.message || "Đã lưu dữ liệu thành công.", "success");
                } else {
                    showToast(data && data.message ? data.message : "Lưu dữ liệu thất bại.", "error");
                }
            })
            .catch(function () {
                showToast("Không thể lưu dữ liệu. Vui lòng thử lại.", "error");
            })
            .finally(function () {
                setButtonLoading(saveBtn, false);
            });
    }

    // ---- Bootstrap --------------------------------------------------------

    document.addEventListener("DOMContentLoaded", function () {
        var fetchBtn = byId(IDS.fetchBtn);
        var saveBtn = byId(IDS.saveBtn);
        var orderCode = byId(IDS.orderCode);

        // Only wire up on the Duck page.
        if (!fetchBtn && !saveBtn) {
            return;
        }

        if (fetchBtn) {
            fetchBtn.addEventListener("click", fetchData);
        }
        if (saveBtn) {
            saveBtn.addEventListener("click", saveData);
        }
        if (orderCode) {
            orderCode.addEventListener("keydown", function (e) {
                if (e.key === "Enter") {
                    e.preventDefault();
                    fetchData();
                }
            });
        }
    });
})();
