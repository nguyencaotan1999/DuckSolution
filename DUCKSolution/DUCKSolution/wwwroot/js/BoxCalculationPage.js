(function (window, document) {
    "use strict";

    var helper = window.CalculationStorageHelper;
    var validation = window.BoxCalculationValidation;
    var service = window.BoxCalculationService;
    var pageState = {
        initialized: false,
        userId: null,
        autosaveTimerId: 0
    };
    var elements = null;

    if (!helper || !validation || !service) {
        console.error("BoxCalculationPage dependencies are missing.");
        return;
    }

    function byId(id) {
        return document.getElementById(id);
    }

    function cacheElements() {
        return {
            page: document.querySelector(".cage-page"),
            panel: byId("boxPanel"),
            tableBody: byId("boxTableBody"),
            boxNumberPerScale: byId("boxnumberId"),
            orderCode: byId("orderCode"),
            fetchBtn: byId("fetchDataBtn"),
            addRowBtn: byId("boxAddRowBtn"),
            saveBtn: byId("saveDataBtn"),
            totalBox: byId("totalBox"),
            totalBoxKg: byId("totalBoxKg"),
            rowCount: byId("boxRowCount"),
            draftStatus: byId("boxDraftStatus")
        };
    }

    function formatTotal(total) {
        return Number(total.toFixed(2)).toString();
    }
    var showLoading = function () {
        $("#loadingBar").css("display", "flex");
        $("#loadingBar").fadeIn()
    }

    var hideLoading = function () {
        $("#loadingBar").css("display", "none");
        $("#loadingBar").fadeOut()
    }

    function setStatus(message, type) {
        helper.setStatus("boxDraftStatus", message, type);
    }

    function setButtonLoading(button, isLoading, loadingText) {
        if (!button) {
            return;
        }

        if (isLoading) {
            if (!button.dataset.originalValue) {
                button.dataset.originalValue = button.value;
            }
            button.disabled = true;
            button.value = loadingText;
            return;
        }

        button.disabled = false;
        if (button.dataset.originalValue) {
            button.value = button.dataset.originalValue;
        }
    }

    function getOrderCode() {
        return helper.getOrderCode("orderCode");
    }

    function getBoxNumberPerScale() {
        if (!elements || !elements.boxNumberPerScale) {
            return 0;
        }

        var value = validation.normalizeNumber(elements.boxNumberPerScale.value);
        if (!Number.isFinite(value) || value <= 0) {
            return 0;
        }

        return Math.floor(value);
    }

    function createRow(row) {
        var tableRow = document.createElement("tr");
        var code1 = row && Number.isFinite(Number(row.boxCode1)) && Number(row.boxCode1) !== 0 ? Number(row.boxCode1) : "";
        var code2 = row && Number.isFinite(Number(row.boxCode2)) && Number(row.boxCode2) !== 0 ? Number(row.boxCode2) : "";
        var code3 = row && Number.isFinite(Number(row.boxCode3)) && Number(row.boxCode3) !== 0 ? Number(row.boxCode3) : "";
        var code4 = row && Number.isFinite(Number(row.boxCode4)) && Number(row.boxCode4) !== 0 ? Number(row.boxCode4) : "";
        var code5 = row && Number.isFinite(Number(row.boxCode5)) && Number(row.boxCode5) !== 0 ? Number(row.boxCode5) : "";
        var rowTotalWeight = row && Number.isFinite(Number(row.boxWeight)) ? Number(row.boxWeight) : 0;
        var rowTotalBox = row && Number.isFinite(Number(row.boxNubmer)) ? Number(row.boxNubmer) : 0;

        tableRow.innerHTML =
            '<td class="box-row__index"></td>' +
            '<td><input type="number" inputmode="decimal" class="form-control box-input box-code box-code-1" min="0" step="1" value="' + code1 + '"></td>' +
            '<td><input type="number" inputmode="decimal" class="form-control box-input box-code box-code-2" min="0" step="1" value="' + code2 + '"></td>' +
            '<td><input type="number" inputmode="decimal" class="form-control box-input box-code box-code-3" min="0" step="1" value="' + code3 + '"></td>' +
            '<td><input type="number" inputmode="decimal" class="form-control box-input box-code box-code-4" min="0" step="1" value="' + code4 + '"></td>' +
            '<td><input type="number" inputmode="decimal" class="form-control box-input box-code box-code-5" min="0" step="1" value="' + code5 + '"></td>' +
            '<td class="box-row__weight">' + formatTotal(rowTotalWeight) + '</td>' +
            '<td class="box-row__number">' + formatTotal(rowTotalBox) + '</td>' +
            '<td><button type="button" class="btn btn-sm btn-outline-danger box-row__remove" aria-label="Xóa dòng" title="Xóa dòng"><i class="bi bi-trash"></i></button></td>';

        return tableRow;
    }

    function getCodeInputs(tableRow) {
        if (!tableRow) {
            return [];
        }

        return Array.prototype.slice.call(tableRow.querySelectorAll(".box-code"));
    }

    // Calculate row totals from Code 1..5 and apply the boxnumberId multiplier for cages.
    function calculateRowTotals(tableRow) {
        var totalWeight = 0;
        var nonZeroCount = 0;

        getCodeInputs(tableRow).forEach(function (input) {
            var raw = input && input.value !== undefined && input.value !== null ? String(input.value).trim() : "";
            var numericValue = Number(raw);
            var isValidNumber = raw !== "" && Number.isFinite(numericValue);

            if (!isValidNumber) {
                return;
            }

            totalWeight += numericValue;
            if (numericValue !== 0) {
                nonZeroCount += 1;
            }
        });

        var totalBox = nonZeroCount * getBoxNumberPerScale();

        var totalWeightCell = tableRow ? tableRow.querySelector(".box-row__weight") : null;
        if (totalWeightCell) {
            totalWeightCell.textContent = formatTotal(totalWeight);
        }

        var totalBoxCell = tableRow ? tableRow.querySelector(".box-row__number") : null;
        if (totalBoxCell) {
            totalBoxCell.textContent = formatTotal(totalBox);
        }

        return {
            totalWeight: totalWeight,
            totalBox: totalBox
        };
    }

    function showPanel() {
        if (elements.panel) {
            elements.panel.classList.remove("d-none");
        }
    }

    function readRows() {
        var rows = [];

        if (!elements.tableBody) {
            return rows;
        }

        elements.tableBody.querySelectorAll("tr").forEach(function (tableRow, index) {
            var codeInputs = getCodeInputs(tableRow);
            if (codeInputs.length < 5) {
                return;
            }

            var rowTotals = calculateRowTotals(tableRow);

            rows.push({
                stt: index + 1,
                boxCode1: validation.parseInputValue(codeInputs[0]),
                boxCode2: validation.parseInputValue(codeInputs[1]),
                boxCode3: validation.parseInputValue(codeInputs[2]),
                boxCode4: validation.parseInputValue(codeInputs[3]),
                boxCode5: validation.parseInputValue(codeInputs[4]),
                boxNubmer: validation.normalizeNumber(rowTotals.totalBox),
                boxWeight: validation.normalizeNumber(rowTotals.totalWeight)
            });
        });

        return rows;
    }

    function updateRowNumbers() {
        if (!elements.tableBody || !elements.rowCount) {
            return;
        }

        var rows = elements.tableBody.rows;
        for (var index = 0; index < rows.length; index += 1) {
            var cell = rows[index].cells[0];
            if (cell) {
                cell.textContent = String(index + 1);
            }
        }

        elements.rowCount.textContent = String(rows.length);
    }

    function recalculateTotals() {
        var totalBox = 0;
        var totalBoxKg = 0;

        if (!elements.tableBody) {
            return;
        }

        elements.tableBody.querySelectorAll("tr").forEach(function (tableRow) {
            var rowTotals = calculateRowTotals(tableRow);
            totalBox += validation.normalizeNumber(rowTotals.totalBox);
            totalBoxKg += validation.normalizeNumber(rowTotals.totalWeight);
        });

        if (elements.totalBox) {
            elements.totalBox.value = formatTotal(totalBox);
        }

        if (elements.totalBoxKg) {
            elements.totalBoxKg.value = formatTotal(totalBoxKg);
        }
    }

    function appendRow(row) {
        if (!elements.tableBody) {
            return;
        }

        elements.tableBody.appendChild(createRow(row));
        updateRowNumbers();
        recalculateTotals();
    }

    function renderRows(rows) {
        if (!elements.tableBody) {
            return;
        }

        elements.tableBody.innerHTML = "";

        if (!rows || rows.length === 0) {
            appendRow({ boxCode1: 0, boxCode2: 0, boxCode3: 0, boxCode4: 0, boxCode5: 0, boxNubmer: 0, boxWeight: 0 });
        } else {
            rows.forEach(function (row) {
                elements.tableBody.appendChild(createRow(row));
            });
            updateRowNumbers();
            recalculateTotals();
        }

        showPanel();
    }

    function buildDraftPayload(orderCode) {
        return {
            orderCode: orderCode,
            totalBox: elements.totalBox ? elements.totalBox.value : "0",
            totalBoxKg: elements.totalBoxKg ? elements.totalBoxKg.value : "0",
            totalBoxInOneTime: getBoxNumberPerScale(),
            rows: readRows(),
            updatedAt: new Date().toISOString()
        };
    }

    function restoreDraft(orderCode, options) {
        var data = service.loadDraft(pageState.userId, orderCode);
        if (!data) {
            return false;
        }

        renderRows(data.rows || []);
        if (elements.boxNumberPerScale && data.totalBoxInOneTime !== undefined && data.totalBoxInOneTime !== null) {
            elements.boxNumberPerScale.value = validation.normalizeNumber(data.totalBoxInOneTime) || "";
        }
        recalculateTotals();
        setStatus("Đã khôi phục bản nháp localStorage.", "success");

        if (!options || options.showToast !== false) {
            window.showSuccessToast("Đã khôi phục dữ liệu nháp từ localStorage.");
        }

        return true;
    }

    function queueAutosave() {
        var orderCode = getOrderCode();
        if (!orderCode) {
            return;
        }

        if (pageState.autosaveTimerId) {
            window.clearTimeout(pageState.autosaveTimerId);
        }

        pageState.autosaveTimerId = window.setTimeout(function () {
            var payload = buildDraftPayload(orderCode);
            if (service.saveDraft(pageState.userId, orderCode, payload)) {
                setStatus("Đã tự động lưu bản nháp lúc " + new Date().toLocaleTimeString(), "success");
            }
        }, 250);
    }

    function handleUnexpectedError(context, error) {
        console.error("BoxCalculationPage " + context + " failed.", error);
        window.showErrorToast("Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.");
    }

    function handleFetch() {
        var orderCheck = validation.validateOrderCode(getOrderCode());
        if (!orderCheck.isValid) {
            setStatus(orderCheck.message, "warning");
            window.showWarningToast(orderCheck.message);
            return;
        }
        showLoading();
        setButtonLoading(elements.fetchBtn, true, "Đang tải...");
        service.setLastOrder(pageState.userId, orderCheck.value);

        service.loadOrderData(pageState.userId, orderCheck.value)
            .then(function (result) {
                if (!result.success) {
                    var restored = restoreDraft(orderCheck.value, { showToast: false });
                    if (!restored) {
                        setStatus(result.message, "warning");
                    }
                    window.showWarningToast(restored ? "Không lấy được dữ liệu máy chủ. Đã dùng bản nháp localStorage." : result.message);
                    return;
                }

                renderRows(result.boxes || []);

                if (elements.boxNumberPerScale && typeof result.totalBoxInOneTime === "number") {
                    elements.boxNumberPerScale.value = result.totalBoxInOneTime === 0 ? "" : String(result.totalBoxInOneTime);
                }

                recalculateTotals();

                if (elements.totalBox && typeof result.totalBox === "number") {
                    elements.totalBox.value = formatTotal(result.totalBox);
                }

                if (elements.totalBoxKg && typeof result.totalBoxKg === "number") {
                    elements.totalBoxKg.value = formatTotal(result.totalBoxKg);
                }

                setStatus("Đã tải dữ liệu từ cơ sở dữ liệu.", "success");
                window.showSuccessToast(result.message);
            })
            .catch(function (error) {
                console.error("GetBoxData failed.", error);
                var restored = restoreDraft(orderCheck.value, { showToast: false });
                setStatus(restored ? "Không thể kết nối cơ sở dữ liệu. Đã khôi phục localStorage." : "Không thể kết nối máy chủ.", restored ? "warning" : "error");
                window.showErrorToast(restored ? "Không thể kết nối máy chủ. Đã khôi phục bản nháp localStorage." : "Không thể kết nối máy chủ. Vui lòng thử lại.");
            })
            .finally(function () {
                setButtonLoading(elements.fetchBtn, false);
                hideLoading();
            });
    }

    async function handleSave() {
        var orderCode = getOrderCode();
        var orderCheck = validation.validateOrderCode(orderCode);
        if (!orderCheck.isValid) {
            setStatus(orderCheck.message, "warning");
            window.showWarningToast(orderCheck.message);
            return;
        }

        var rows = readRows();
        var validationResult = service.validateBeforeSave(orderCode, rows);

        if (!validationResult.isValid) {
            setStatus(validationResult.message, "warning");
            window.showWarningToast(validationResult.message);
            return;
        }
        showLoading();
        setButtonLoading(elements.saveBtn, true, "Đang lưu...");
        recalculateTotals();
        rows = readRows();
        service.setLastOrder(pageState.userId, orderCode);
        var CheckCodeExisting = await service.loadOrderData(pageState.userId, orderCheck.value)
            .then(function (result) {
                if (!result.success) {
                    return false;
                }
                return true;
            })
            .catch(function (error) {
                console.error("GetBoxData failed.", error);
            })
            .finally(function () {
            });

        if (CheckCodeExisting) {
            await service.saveOrderData(pageState.userId, orderCode, rows, getBoxNumberPerScale())
                .then(function (result) {
                    if (!result.success) {
                        setStatus(result.message, "error");
                        window.showErrorToast(result.message);
                        return;
                    }

                    if (elements.totalBox && typeof result.totalBox === "number") {
                        elements.totalBox.value = formatTotal(result.totalBox);
                    }

                    if (elements.totalBoxKg && typeof result.totalBoxKg === "number") {
                        elements.totalBoxKg.value = formatTotal(result.totalBoxKg);
                    }

                    service.clearDraft(pageState.userId, orderCode);
                    setStatus("Đã lưu dữ liệu vào cơ sở dữ liệu.", "success");
                    window.showSuccessToast(result.message);
                })
                .catch(function (error) {
                    console.error("SaveBoxData failed.", error);
                    setStatus("Không thể lưu dữ liệu vào cơ sở dữ liệu.", "error");
                    window.showErrorToast("Không thể lưu dữ liệu. Vui lòng thử lại.");
                })
                .finally(function () {
                    setButtonLoading(elements.saveBtn, false);
                    hideLoading();
                });
        } else {
            setButtonLoading(elements.saveBtn, false);
            hideLoading();
            window.showWarningToast("Lưu thất bại......Không tìm thấy mã đơn hàng của người dùng hiện tại");
        }

        
    }

    function onTableInput(event) {
        var target = event.target;
        if (!(target instanceof HTMLInputElement)) {
            return;
        }

        if (target.classList.contains("box-code")) {
            validation.trimInputLength(target, validation.boxWeightMaxDigits);
            var row = target.closest("tr");
            if (row) {
                calculateRowTotals(row);
            }
        }

        recalculateTotals();
        queueAutosave();
    }

    function onTableClick(event) {
        var removeBtn = event.target.closest(".box-row__remove");
        if (!removeBtn) {
            return;
        }

        var tableRow = removeBtn.closest("tr");
        if (tableRow && tableRow.parentNode) {
            tableRow.parentNode.removeChild(tableRow);
        }

        if (elements.tableBody && elements.tableBody.rows.length === 0) {
            appendRow({ boxCode1: 0, boxCode2: 0, boxCode3: 0, boxCode4: 0, boxCode5: 0, boxNubmer: 0, boxWeight: 0 });
            return;
        }

        updateRowNumbers();
        recalculateTotals();
        queueAutosave();
    }

    function bindEvents() {
        if (!elements.page || elements.page.dataset.boxCalculationBound === "true") {
            return;
        }

        elements.page.dataset.boxCalculationBound = "true";

        if (elements.fetchBtn) {
            elements.fetchBtn.addEventListener("click", function () {
                try {
                    handleFetch();
                } catch (error) {
                    handleUnexpectedError("fetch", error);
                }
            });
        }

        if (elements.addRowBtn) {
            elements.addRowBtn.addEventListener("click", function () {
                try {
                    appendRow({ boxCode1: 0, boxCode2: 0, boxCode3: 0, boxCode4: 0, boxCode5: 0, boxNubmer: 0, boxWeight: 0 });
                    showPanel();
                } catch (error) {
                    handleUnexpectedError("addRow", error);
                }
            });
        }

        if (elements.boxNumberPerScale) {
            elements.boxNumberPerScale.addEventListener("input", function (event) {
                var input = event.target;
                if (input instanceof HTMLInputElement) {
                    validation.trimInputLength(input, validation.boxNumberMaxDigits);
                }
                recalculateTotals();
                queueAutosave();
            });

            elements.boxNumberPerScale.addEventListener("change", function () {
                recalculateTotals();
                queueAutosave();
            });
        }

        if (elements.saveBtn) {
            elements.saveBtn.addEventListener("click", function () {
                try {
                    handleSave();
                } catch (error) {
                    handleUnexpectedError("save", error);
                }
            });
        }

        if (elements.orderCode) {
            elements.orderCode.addEventListener("keydown", function (event) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    handleFetch();
                }
            });

            elements.orderCode.addEventListener("change", function () {
                var orderCode = getOrderCode();
                if (!orderCode) {
                    return;
                }

                service.setLastOrder(pageState.userId, orderCode);
                restoreDraft(orderCode, { showToast: false });
            });
        }

        if (elements.tableBody) {
            elements.tableBody.addEventListener("input", onTableInput);
            elements.tableBody.addEventListener("change", onTableInput);
            elements.tableBody.addEventListener("click", onTableClick);
        }

        elements.page.addEventListener("change", function () {
            queueAutosave();
        });
    }

    function restoreLastSession() {
        var lastOrder = service.getLastOrder(pageState.userId);
        if (!lastOrder || !lastOrder.orderCode || !elements.orderCode || elements.orderCode.value) {
            return;
        }

        elements.orderCode.value = lastOrder.orderCode;
        restoreDraft(lastOrder.orderCode, { showToast: false });
    }

    function init() {
        if (pageState.initialized) {
            return;
        }

        elements = cacheElements();
        if (!elements.tableBody || !elements.page) {
            return;
        }

        pageState.userId = helper.requireLoggedInOrRedirect("/Admin/SignInPage", "boxDraftStatusHost");
        if (!pageState.userId) {
            return;
        }

        pageState.initialized = true;
        bindEvents();
        restoreLastSession();
    }

    window.BoxCalculationPage = {
        init: init,
        recalculateTotals: recalculateTotals,
        readRows: readRows
    };

    document.addEventListener("DOMContentLoaded", function () {
        window.BoxCalculationPage.init();
    });
})(window, document);