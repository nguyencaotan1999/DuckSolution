(function (window) {
    "use strict";

    var AUTH_KEY = "loggedInUserId";

    function getLoggedInUserId() {
        var raw = window.localStorage.getItem(AUTH_KEY);
        if (!raw) {
            return null;
        }

        var parsed = Number(raw);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            return null;
        }

        return parsed;
    }

    function getOrderCode(orderCodeInputId) {
        var input = document.getElementById(orderCodeInputId);
        if (!input) {
            return "";
        }

        return String(input.value || "").trim();
    }

    function buildKey(prefix, userId, orderCode) {
        var safeCode = String(orderCode || "").trim();
        return prefix + "_" + String(userId) + "_" + safeCode;
    }

    function saveJson(key, value) {
        window.localStorage.setItem(key, JSON.stringify(value));
    }

    function readJson(key) {
        var raw = window.localStorage.getItem(key);
        if (!raw) {
            return null;
        }

        try {
            return JSON.parse(raw);
        } catch (_err) {
            return null;
        }
    }

    function remove(key) {
        window.localStorage.removeItem(key);
    }

    function requireLoggedInOrRedirect(signInUrl, messageHostId) {
        var userId = getLoggedInUserId();
        if (userId) {
            return userId;
        }

        var host = messageHostId ? document.getElementById(messageHostId) : null;
        if (host) {
            host.innerHTML = "<div class=\"alert alert-warning\" role=\"alert\">Vui lòng đăng nhập trước khi sử dụng trang tính.</div>";
        } else {
            window.alert("Vui lòng đăng nhập trước khi sử dụng trang tính.");
        }

        if (signInUrl) {
            window.setTimeout(function () {
                window.location.href = signInUrl;
            }, 800);
        }

        return null;
    }

    function setStatus(statusId, message, type) {
        var el = document.getElementById(statusId);
        if (!el) {
            return;
        }

        var css = "text-muted";
        if (type === "success") {
            css = "text-success";
        } else if (type === "error") {
            css = "text-danger";
        } else if (type === "warning") {
            css = "text-warning";
        }

        el.className = "small " + css;
        el.textContent = message;
    }

    window.CalculationStorageHelper = {
        getLoggedInUserId: getLoggedInUserId,
        getOrderCode: getOrderCode,
        buildKey: buildKey,
        saveJson: saveJson,
        readJson: readJson,
        remove: remove,
        requireLoggedInOrRedirect: requireLoggedInOrRedirect,
        setStatus: setStatus
    };
})(window);
