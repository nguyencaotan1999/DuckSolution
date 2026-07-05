(function (window) {
    "use strict";

    var ORDER_CODE_MAX_LENGTH = 15;
    var BOX_NUMBER_MAX_DIGITS = 6;
    var BOX_WEIGHT_MAX_DIGITS = 6;

    function normalizeNumber(value) {
        var parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function parseInputValue(input) {
        if (!input) {
            return 0;
        }

        return normalizeNumber(input.value || 0);
    }

    function trimInputLength(input, maxDigits) {
        if (!input) {
            return;
        }

        var value = String(input.value || "");
        if (value.length > maxDigits) {
            input.value = value.slice(0, maxDigits);
        }
    }

    function validateOrderCode(orderCode) {
        var trimmed = String(orderCode || "").trim();
        if (!trimmed) {
            return {
                isValid: false,
                message: "Vui lòng nhập mã đơn hàng."
            };
        }

        if (trimmed.length > ORDER_CODE_MAX_LENGTH) {
            return {
                isValid: false,
                message: "Mã đơn hàng không được vượt quá 15 ký tự."
            };
        }

        return {
            isValid: true,
            value: trimmed
        };
    }

    function validateRows(rows) {
        if (!Array.isArray(rows)) {
            return {
                isValid: false,
                message: "Dữ liệu lồng không hợp lệ."
            };
        }

        for (var index = 0; index < rows.length; index += 1) {
            var row = rows[index] || {};
            var boxNumber = normalizeNumber(row.boxNubmer);
            var boxWeight = normalizeNumber(row.boxWeight);

            if (!Number.isFinite(boxNumber) || !Number.isFinite(boxWeight)) {
                return {
                    isValid: false,
                    message: "Số Lồng và Số Ký phải là số hợp lệ."
                };
            }

            if (boxNumber < 0 || boxWeight < 0) {
                return {
                    isValid: false,
                    message: "Giá trị Số Lồng / Số Ký không được âm."
                };
            }
        }

        return {
            isValid: true
        };
    }

    window.BoxCalculationValidation = {
        boxNumberMaxDigits: BOX_NUMBER_MAX_DIGITS,
        boxWeightMaxDigits: BOX_WEIGHT_MAX_DIGITS,
        normalizeNumber: normalizeNumber,
        parseInputValue: parseInputValue,
        trimInputLength: trimInputLength,
        validateOrderCode: validateOrderCode,
        validateRows: validateRows
    };
})(window);