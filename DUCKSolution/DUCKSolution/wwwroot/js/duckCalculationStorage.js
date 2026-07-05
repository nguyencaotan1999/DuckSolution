(function (window, document) {
    "use strict";

    var helper = window.CalculationStorageHelper;
    if (!helper) {
        return;
    }

    var DRAFT_PREFIX = "duckCalculationData";
    var LAST_ORDER_KEY_PREFIX = "duckCalculationLastOrder";

    function byId(id) {
        return document.getElementById(id);
    }

    function getRows() {
        var rows = [];
        document.querySelectorAll("#duckTableBody tr").forEach(function (tr) {
            var inputs = tr.querySelectorAll(".duck-code");
            if (!inputs || inputs.length < 5) {
                return;
            }

            rows.push({
                code1: Number(inputs[0].value || 0),
                code2: Number(inputs[1].value || 0),
                code3: Number(inputs[2].value || 0),
                code4: Number(inputs[3].value || 0),
                code5: Number(inputs[4].value || 0)
            });
        });

        return rows;
    }

    function collectDraft(orderCode) {
        return {
            orderCode: orderCode,
            totalDuckinBox: byId("ducksPerCage") ? byId("ducksPerCage").value : "",
            totalBoxInOneTime: byId("cagesPerWeighing") ? byId("cagesPerWeighing").value : "",
            boxWeight: byId("totalBoxKg") ? byId("totalBoxKg").value : "",
            decreaseDuck: byId("someInput1") ? byId("someInput1").value : "",
            currency: byId("someInput2") ? byId("someInput2").value : "",
            codeDetails: getRows(),
            updatedAt: new Date().toISOString()
        };
    }

    function renderRows(rows) {
        var body = byId("duckTableBody");
        if (!body) {
            return;
        }

        body.innerHTML = "";
        (rows || []).forEach(function (item, i) {
            var row = document.createElement("tr");
            row.innerHTML =
                '<td class="duck-row__index"><span class="duck-row__no">' + (i + 1) + '</span></td>' +
                '<td><input type="number" class="form-control duck-input duck-code" min="0" step="1" value="' + (item.code1 || 0) + '"></td>' +
                '<td><input type="number" class="form-control duck-input duck-code" min="0" step="1" value="' + (item.code2 || 0) + '"></td>' +
                '<td><input type="number" class="form-control duck-input duck-code" min="0" step="1" value="' + (item.code3 || 0) + '"></td>' +
                '<td><input type="number" class="form-control duck-input duck-code" min="0" step="1" value="' + (item.code4 || 0) + '"></td>' +
                '<td><input type="number" class="form-control duck-input duck-code" min="0" step="1" value="' + (item.code5 || 0) + '"></td>' +
                '<td class="duck-row__weight">0</td><td class="duck-row__ducks">0</td><td class="duck-row__average">0</td>';
            body.appendChild(row);
        });

        var rowCount = byId("duckRowCount");
        if (rowCount) {
            rowCount.textContent = String((rows || []).length);
        }

        var first = body.querySelector(".duck-code");
        if (first) {
            first.dispatchEvent(new Event("input", { bubbles: true }));
        }
    }

    function saveDraft(userId) {
        var orderCode = helper.getOrderCode("orderCodeDuckPage");
        if (!orderCode) {
            return;
        }

        var key = helper.buildKey(DRAFT_PREFIX, userId, orderCode);
        helper.saveJson(key, collectDraft(orderCode));
        helper.saveJson(LAST_ORDER_KEY_PREFIX + "_" + userId, { orderCode: orderCode });
        helper.setStatus("duckDraftStatus", "Đã tự động lưu bản nháp lúc " + new Date().toLocaleTimeString(), "success");
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

        var setVal = function (id, val) {
            var el = byId(id);
            if (!el) {
                return;
            }

            el.value = (val === null || val === undefined) ? "" : val;
            el.dispatchEvent(new Event("input", { bubbles: true }));
        };

        setVal("ducksPerCage", data.totalDuckinBox);
        setVal("cagesPerWeighing", data.totalBoxInOneTime);
        setVal("totalBoxKg", data.boxWeight);
        setVal("someInput1", data.decreaseDuck);
        setVal("someInput2", data.currency);
        renderRows(data.codeDetails || []);

        helper.setStatus("duckDraftStatus", "Đã khôi phục bản nháp localStorage.", "success");
        return true;
    }

    function wireAutosave(userId) {
        var duckPage = document.querySelector(".duck-page");
        if (!duckPage) {
            return;
        }

        var timer = null;
        duckPage.addEventListener("input", function () {
            if (timer) {
                window.clearTimeout(timer);
            }
            timer = window.setTimeout(function () {
                saveDraft(userId);
            }, 250);
        });

        duckPage.addEventListener("change", function () {
            saveDraft(userId);
        });
    }

    function clearDraftForOrder(userId, orderCode) {
        if (!orderCode) {
            return;
        }

        var key = helper.buildKey(DRAFT_PREFIX, userId, orderCode);
        helper.remove(key);
    }

    document.addEventListener("DOMContentLoaded", function () {
        if (!byId("duckTableBody")) {
            return;
        }

        var userId = helper.requireLoggedInOrRedirect("/Admin/SignInPage", "duckDraftStatusHost");
        if (!userId) {
            return;
        }

        wireAutosave(userId);

        var orderInput = byId("orderCodeDuckPage");
        if (orderInput) {
            orderInput.addEventListener("change", function () {
                restoreDraft(userId, helper.getOrderCode("orderCodeDuckPage"));
            });
        }

        var lastOrder = helper.readJson(LAST_ORDER_KEY_PREFIX + "_" + userId);
        if (lastOrder && lastOrder.orderCode && orderInput && !orderInput.value) {
            orderInput.value = lastOrder.orderCode;
            restoreDraft(userId, lastOrder.orderCode);
        }

        window.DuckCalculationStorage = {
            clearDraftForOrder: function (orderCode) {
                clearDraftForOrder(userId, orderCode);
            },
            restoreDraft: function (orderCode) {
                return restoreDraft(userId, orderCode);
            }
        };
    });
})(window, document);
