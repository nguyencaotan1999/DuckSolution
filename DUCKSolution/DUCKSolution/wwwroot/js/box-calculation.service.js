(function (window) {
    "use strict";

    var helper = window.CalculationStorageHelper;
    var validation = window.BoxCalculationValidation;
    var DRAFT_PREFIX = "boxCalculationData";
    var LAST_ORDER_PREFIX = "boxCalculationLastOrder";

    if (!helper || !validation) {
        console.error("BoxCalculationService dependencies are missing.");
        return;
    }

    function readAntiForgeryToken() {
        var input = document.querySelector('input[name="__RequestVerificationToken"]');
        return input ? input.value : "";
    }

    function buildDraftKey(userId, orderCode) {
        return helper.buildKey(DRAFT_PREFIX, userId, orderCode);
    }

    function buildLastOrderKey(userId) {
        return LAST_ORDER_PREFIX + "_" + String(userId);
    }

    function saveDraft(userId, orderCode, payload) {
        if (!userId || !orderCode) {
            return false;
        }

        helper.saveJson(buildDraftKey(userId, orderCode), payload);
        helper.saveJson(buildLastOrderKey(userId), { orderCode: orderCode });
        return true;
    }

    function loadDraft(userId, orderCode) {
        if (!userId || !orderCode) {
            return null;
        }

        return helper.readJson(buildDraftKey(userId, orderCode));
    }

    function clearDraft(userId, orderCode) {
        if (!userId || !orderCode) {
            return;
        }

        helper.remove(buildDraftKey(userId, orderCode));
    }

    function getLastOrder(userId) {
        if (!userId) {
            return null;
        }

        return helper.readJson(buildLastOrderKey(userId));
    }

    function setLastOrder(userId, orderCode) {
        if (!userId || !orderCode) {
            return;
        }

        helper.saveJson(buildLastOrderKey(userId), { orderCode: orderCode });
    }

    function loadOrderData(userId, orderCode) {
        return fetch("/Admin/GetBoxData?userId=" + encodeURIComponent(String(userId)) + "&orderCode=" + encodeURIComponent(orderCode), {
            headers: {
                "Accept": "application/json"
            }
        })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error("GetBoxData request failed with status " + response.status + ".");
                }

                return response.json();
            })
            .then(function (data) {
                return {
                    success: !!(data && data.success),
                    message: data && data.message ? data.message : "Không có dữ liệu.",
                    boxes: data && Array.isArray(data.boxes) ? data.boxes : [],
                    totalBox: data ? data.totalBox : 0,
                    totalBoxKg: data ? data.totalBoxKg : 0,
                    raw: data
                };
            });
    }

    function saveOrderData(userId, orderCode, rows) {
        return fetch("/Admin/SaveBoxData", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "RequestVerificationToken": readAntiForgeryToken()
            },
            body: JSON.stringify({
                userId: userId,
                orderCode: orderCode,
                rows: rows
            })
        })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error("SaveBoxData request failed with status " + response.status + ".");
                }

                return response.json();
            })
            .then(function (data) {
                return {
                    success: !!(data && data.success),
                    message: data && data.message ? data.message : "Lưu dữ liệu thất bại.",
                    totalBox: data ? data.totalBox : 0,
                    totalBoxKg: data ? data.totalBoxKg : 0,
                    raw: data
                };
            });
    }

    function validateBeforeSave(orderCode, rows) {
        var orderCheck = validation.validateOrderCode(orderCode);
        if (!orderCheck.isValid) {
            return orderCheck;
        }

        return validation.validateRows(rows);
    }

    window.BoxCalculationService = {
        readAntiForgeryToken: readAntiForgeryToken,
        saveDraft: saveDraft,
        loadDraft: loadDraft,
        clearDraft: clearDraft,
        getLastOrder: getLastOrder,
        setLastOrder: setLastOrder,
        loadOrderData: loadOrderData,
        saveOrderData: saveOrderData,
        validateBeforeSave: validateBeforeSave
    };
})(window);