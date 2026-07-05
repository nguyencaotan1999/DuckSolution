(function (window, document) {
    "use strict";

    var helper = window.CalculationStorageHelper;
    if (!helper) {
        return;
    }

    var DRAFT_PREFIX = "boxCalculationData";
    var LAST_ORDER_KEY_PREFIX = "boxCalculationLastOrder";

    function byId(id) {
        return document.getElementById(id);
    }

    function toast(message, type) {
        if (typeof window.showToast === "function") {
            window.showToast(message, type);
            return;
        }

        console.log(message);
    }

    function setButtonLoading(btn, isLoading, loadingText) {
        if (!btn) {
            return;
        }

        if (isLoading) {
            btn.dataset.originalValue = btn.value;
            btn.disabled = true;
            btn.value = loadingText;
        } else {
            btn.disabled = false;
            if (btn.dataset.originalValue) {
                btn.value = btn.dataset.originalValue;
            }
        }
    }

    function readRows() {
        var rows = [];
        document.querySelectorAll("#boxTableBody tr").forEach(function (tr, idx) {
            var numberInput = tr.querySelector(".box-number");
            var weightInput = tr.querySelector(".box-weight");

            if (!numberInput || !weightInput) {
                return;
            }

            var boxNubmer = Number(numberInput.value || 0);
            var boxWeight = Number(weightInput.value || 0);

            if (!Number.isFinite(boxNubmer) || !Number.isFinite(boxWeight) || boxNubmer < 0 || boxWeight < 0) {
                return;
            }

            rows.push({
                stt: idx + 1,
                boxNubmer: boxNubmer,
                boxWeight: boxWeight
            });
        });

        return rows;
    }

    function renderRows(rows) {
        var tableBody = byId("boxTableBody");
        if (!tableBody) {
            return;
        }

        tableBody.innerHTML = "";

        if (!rows || rows.length === 0) {
            var addBtn = byId("boxAddRowBtn");
            if (addBtn) {
                addBtn.click();
            }
            return;
        }

        rows.forEach(function (row, index) {
            var tr = document.createElement("tr");
            tr.innerHTML =
                '<td class="box-row__index">' + (index + 1) + '</td>' +
                '<td><input type="number" class="form-control box-input box-number" min="0" step="1" value="' + (row.boxNubmer || 0) + '"></td>' +
                '<td><input type="number" class="form-control box-input box-weight" min="0" step="any" value="' + (row.boxWeight || 0) + '"></td>' +
                '<td><button type="button" class="btn btn-sm btn-outline-danger box-row__remove" aria-label="Xóa dòng" title="Xóa dòng"><i class="bi bi-trash"></i></button></td>';
            tableBody.appendChild(tr);
        });

        var panel = byId("boxPanel");
        if (panel) {
            panel.classList.remove("d-none");
        }

        var first = tableBody.querySelector(".box-number");
        if (first) {
            first.dispatchEvent(new Event("input", { bubbles: true }));
        }
    }

    function buildDraftPayload(orderCode) {
        return {
            orderCode: orderCode,
            totalBox: byId("totalBox") ? byId("totalBox").value : "0",
            totalBoxKg: byId("totalBoxKg") ? byId("totalBoxKg").value : "0",
            rows: readRows(),
            updatedAt: new Date().toISOString()
        };
    }

    function saveDraft(userId) {
        var orderCode = helper.getOrderCode("orderCode");
        if (!orderCode) {
            return;
        }

        var key = helper.buildKey(DRAFT_PREFIX, userId, orderCode);
        helper.saveJson(key, buildDraftPayload(orderCode));
        helper.saveJson(LAST_ORDER_KEY_PREFIX + "_" + userId, { orderCode: orderCode });
        helper.setStatus("boxDraftStatus", "Đã tự động lưu bản nháp lúc " + new Date().toLocaleTimeString(), "success");
    }

    function restoreDraft(userId, orderCode) {
        if (!orderCode) {
            return false;
        }

        var key = helper.buildKey(DRAFT_PREFIX, userId, orderCode);
        var data = helper.readJson(key);
        if (!data) {
            return false;
        }

        renderRows(data.rows || []);
        toast("Đã khôi phục dữ liệu nháp từ localStorage.", "success");
        helper.setStatus("boxDraftStatus", "Đã khôi phục bản nháp localStorage.", "success");
        return true;
    }

    function wireAutosave(userId) {
        var cagePage = document.querySelector(".cage-page");
        if (!cagePage) {
            return;
        }

        var timer = null;
        cagePage.addEventListener("input", function () {
            if (timer) {
                window.clearTimeout(timer);
            }
            timer = window.setTimeout(function () {
                saveDraft(userId);
            }, 250);
        });

        cagePage.addEventListener("change", function () {
            saveDraft(userId);
        });
    }

    function getAntiForgeryToken() {
        var input = document.querySelector('input[name="__RequestVerificationToken"]');
        return input ? input.value : "";
    }

    function replaceButton(oldBtn) {
        if (!oldBtn || !oldBtn.parentNode) {
            return oldBtn;
        }

        var newBtn = oldBtn.cloneNode(true);
        oldBtn.parentNode.replaceChild(newBtn, oldBtn);
        return newBtn;
    }

    function wireServerActions(userId) {
        var fetchBtn = replaceButton(byId("fetchDataBtn"));
        var saveBtn = replaceButton(byId("saveDataBtn"));

        if (fetchBtn) {
            fetchBtn.addEventListener("click", function () {
                var orderCode = helper.getOrderCode("orderCode");
                if (!orderCode) {
                    helper.setStatus("boxDraftStatus", "Vui lòng nhập mã đơn hàng.", "warning");
                    return;
                }

                setButtonLoading(fetchBtn, true, "Đang tải...");
                fetch("/Admin/GetBoxData?userId=" + encodeURIComponent(String(userId)) + "&orderCode=" + encodeURIComponent(orderCode), {
                    headers: { "Accept": "application/json" }
                })
                    .then(function (res) { return res.json(); })
                    .then(function (data) {
                        if (!data || !data.success) {
                            var restored = restoreDraft(userId, orderCode);
                            if (!restored) {
                                helper.setStatus("boxDraftStatus", (data && data.message) ? data.message : "Không có dữ liệu.", "warning");
                            }
                            return;
                        }

                        renderRows(data.boxes || []);
                        helper.setStatus("boxDraftStatus", "Đã tải dữ liệu từ cơ sở dữ liệu.", "success");
                    })
                    .catch(function () {
                        helper.setStatus("boxDraftStatus", "Không thể kết nối máy chủ. Đang thử khôi phục localStorage...", "error");
                        restoreDraft(userId, orderCode);
                    })
                    .finally(function () {
                        setButtonLoading(fetchBtn, false);
                    });
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener("click", function () {
                var orderCode = helper.getOrderCode("orderCode");
                if (!orderCode) {
                    helper.setStatus("boxDraftStatus", "Vui lòng nhập mã đơn hàng.", "warning");
                    return;
                }

                var payload = {
                    userId: userId,
                    orderCode: orderCode,
                    rows: readRows()
                };

                setButtonLoading(saveBtn, true, "Đang lưu...");
                fetch("/Admin/SaveBoxData", {
                    method: "POST",
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "RequestVerificationToken": getAntiForgeryToken()
                    },
                    body: JSON.stringify(payload)
                })
                    .then(function (res) { return res.json(); })
                    .then(function (data) {
                        if (!data || !data.success) {
                            helper.setStatus("boxDraftStatus", (data && data.message) ? data.message : "Lưu dữ liệu thất bại.", "error");
                            return;
                        }

                        helper.setStatus("boxDraftStatus", "Đã lưu dữ liệu vào cơ sở dữ liệu.", "success");
                        var key = helper.buildKey(DRAFT_PREFIX, userId, orderCode);
                        helper.remove(key);
                    })
                    .catch(function () {
                        helper.setStatus("boxDraftStatus", "Không thể lưu dữ liệu vào cơ sở dữ liệu.", "error");
                    })
                    .finally(function () {
                        setButtonLoading(saveBtn, false);
                    });
            });
        }
    }

    document.addEventListener("DOMContentLoaded", function () {
        if (!byId("boxTableBody")) {
            return;
        }

        var userId = helper.requireLoggedInOrRedirect("/Admin/SignInPage", "boxDraftStatusHost");
        if (!userId) {
            return;
        }

        wireAutosave(userId);
        wireServerActions(userId);

        var orderInput = byId("orderCode");
        if (orderInput) {
            orderInput.addEventListener("change", function () {
                restoreDraft(userId, helper.getOrderCode("orderCode"));
            });
        }

        var lastOrder = helper.readJson(LAST_ORDER_KEY_PREFIX + "_" + userId);
        if (lastOrder && lastOrder.orderCode && orderInput && !orderInput.value) {
            orderInput.value = lastOrder.orderCode;
            restoreDraft(userId, lastOrder.orderCode);
        }
    });
})(window, document);
