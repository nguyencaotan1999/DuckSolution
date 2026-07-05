(function (window, document) {
    "use strict";

    var CONTAINER_ID = "toastContainer";
    var DEFAULT_DELAY = 4000;
    var TYPE_CONFIG = {
        success: {
            toastClass: "text-bg-success",
            iconClass: "bi-check-circle"
        },
        error: {
            toastClass: "text-bg-danger",
            iconClass: "bi-exclamation-triangle"
        },
        warning: {
            toastClass: "text-bg-warning text-dark",
            iconClass: "bi-exclamation-circle"
        },
        info: {
            toastClass: "text-bg-primary",
            iconClass: "bi-info-circle"
        }
    };

    function getTypeConfig(type) {
        return TYPE_CONFIG[type] || TYPE_CONFIG.info;
    }

    function resolveContainer() {
        var container = document.getElementById(CONTAINER_ID);
        if (container) {
            return container;
        }

        if (!document.body) {
            console.warn("Toast container is unavailable because document.body is not ready.");
            return null;
        }

        container = document.createElement("div");
        container.id = CONTAINER_ID;
        container.className = "toast-container position-fixed bottom-0 end-0 p-3";
        container.setAttribute("aria-live", "polite");
        container.setAttribute("aria-atomic", "true");
        document.body.appendChild(container);
        return container;
    }

    function removeToast(toastEl) {
        if (toastEl && toastEl.parentNode) {
            toastEl.parentNode.removeChild(toastEl);
        }
    }

    function createToastElement(message, type) {
        var config = getTypeConfig(type);
        var toastEl = document.createElement("div");
        var content = document.createElement("div");
        var body = document.createElement("div");
        var icon = document.createElement("i");
        var text = document.createElement("span");
        var closeButton = document.createElement("button");

        toastEl.className = "toast align-items-center border-0 " + config.toastClass;
        toastEl.setAttribute("role", "alert");
        toastEl.setAttribute("aria-live", "assertive");
        toastEl.setAttribute("aria-atomic", "true");

        content.className = "d-flex";
        body.className = "toast-body d-flex align-items-center gap-2";

        icon.className = "bi " + config.iconClass;
        text.textContent = String(message || "");

        closeButton.type = "button";
        closeButton.className = type === "warning" ? "btn-close me-2 m-auto" : "btn-close btn-close-white me-2 m-auto";
        closeButton.setAttribute("data-bs-dismiss", "toast");
        closeButton.setAttribute("aria-label", "Close");

        body.appendChild(icon);
        body.appendChild(text);
        content.appendChild(body);
        content.appendChild(closeButton);
        toastEl.appendChild(content);

        return toastEl;
    }

    function showToast(message, type, options) {
        var container = resolveContainer();
        var safeType = TYPE_CONFIG[type] ? type : "info";
        var delay = options && Number.isFinite(options.delay) ? options.delay : DEFAULT_DELAY;

        if (!container) {
            console.warn("Toast container not found. Message:", message);
            return null;
        }

        var toastEl = createToastElement(message, safeType);
        container.appendChild(toastEl);

        if (window.bootstrap && window.bootstrap.Toast) {
            var toastInstance = new window.bootstrap.Toast(toastEl, {
                autohide: !(options && options.autohide === false),
                delay: delay
            });

            toastEl.addEventListener("hidden.bs.toast", function () {
                removeToast(toastEl);
            }, { once: true });

            toastInstance.show();
            return toastInstance;
        }

        window.setTimeout(function () {
            removeToast(toastEl);
        }, delay);

        return null;
    }

    function showSuccessToast(message, options) {
        return showToast(message, "success", options);
    }

    function showErrorToast(message, options) {
        return showToast(message, "error", options);
    }

    function showWarningToast(message, options) {
        return showToast(message, "warning", options);
    }

    function showInfoToast(message, options) {
        return showToast(message, "info", options);
    }

    window.ToastHelper = {
        showToast: showToast,
        showSuccessToast: showSuccessToast,
        showErrorToast: showErrorToast,
        showWarningToast: showWarningToast,
        showInfoToast: showInfoToast
    };

    window.showToast = showToast;
    window.showSuccessToast = showSuccessToast;
    window.showErrorToast = showErrorToast;
    window.showWarningToast = showWarningToast;
    window.showInfoToast = showInfoToast;
})(window, document);