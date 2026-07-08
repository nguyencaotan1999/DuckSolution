(function (window, document) {
    "use strict";

    var helper = window.CalculationStorageHelper;
    var CREATE_ORDER_URL = "/Home/CreateNewCalculationAsync";
    var AUTH_KEY = "loggedInUserId";

    var pageState = {
        initialized: false,
        isCreatingOrder: false
    };

    function byId(id) {
        return document.getElementById(id);
    }

    function readAntiForgeryToken() {
        var tokenInput = document.querySelector('input[name="__RequestVerificationToken"]');
        return tokenInput ? tokenInput.value : "";
    }

    var showLoading = function () {
        $("#loadingBar").css("display", "flex");
        $("#loadingBar").fadeIn()
    }

    var hideLoading = function () {
        $("#loadingBar").css("display", "none");
        $("#loadingBar").fadeOut()
    }

    function showHomeToast(message, kind) {
        var type = kind || "info";

        if (type === "success" && typeof window.showSuccessToast === "function") {
            window.showSuccessToast(message);
            return;
        }

        if (type === "warning" && typeof window.showWarningToast === "function") {
            window.showWarningToast(message);
            return;
        }

        if (type === "error" && typeof window.showErrorToast === "function") {
            window.showErrorToast(message);
            return;
        }

        if (typeof window.showInfoToast === "function") {
            window.showInfoToast(message);
            return;
        }

        var container = byId("homeToastContainer");
        if (!container) {
            window.alert(message);
            return;
        }

        var bgClass = "text-bg-dark";
        if (type === "success") {
            bgClass = "text-bg-success";
        } else if (type === "warning") {
            bgClass = "text-bg-warning text-dark";
        } else if (type === "error") {
            bgClass = "text-bg-danger";
        }

        var toastEl = document.createElement("div");
        toastEl.className = "toast align-items-center " + bgClass + " border-0";
        toastEl.setAttribute("role", "alert");
        toastEl.setAttribute("aria-live", "assertive");
        toastEl.setAttribute("aria-atomic", "true");
        toastEl.innerHTML =
            '<div class="d-flex">' +
            '<div class="toast-body">' + message + "</div>" +
            '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>' +
            "</div>";

        container.appendChild(toastEl);

        if (window.bootstrap && window.bootstrap.Toast) {
            var toast = new window.bootstrap.Toast(toastEl, { delay: 2800 });
            toastEl.addEventListener("hidden.bs.toast", function () {
                toastEl.remove();
            });
            toast.show();
            return;
        }

        window.setTimeout(function () {
            toastEl.remove();
        }, 2800);
    }

    function setCreateButtonState(button, isLoading) {
        if (!button) {
            return;
        }

        if (isLoading) {
            if (!button.dataset.originalText) {
                button.dataset.originalText = button.textContent || "Tạo mã đơn hàng";
            }
            button.disabled = true;
            button.textContent = "Đang tạo...";
            return;
        }

        button.disabled = false;
        if (button.dataset.originalText) {
            button.textContent = button.dataset.originalText;
        }
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

    // Resolve UserId using existing project auth/session patterns only.
    // Priority order:
    // 1) CalculationStorageHelper.getLoggedInUserId (if helper is loaded on this page)
    // 2) localStorage key used by auth.js after successful sign-in
    // 3) window.authSignInResult (available in sign-in redirect flow)
    function resolveCurrentUserId() {
        var resolvedUserId = null;

        if (helper && typeof helper.getLoggedInUserId === "function") {
            resolvedUserId = helper.getLoggedInUserId();
            console.log("[homePage] UserId from CalculationStorageHelper:", resolvedUserId);
        } else {
            console.warn("[homePage] CalculationStorageHelper is unavailable on this page; using fallback resolution.");
        }

        if (!resolvedUserId) {
            var rawFromStorage = window.localStorage.getItem(AUTH_KEY);
            var parsedFromStorage = Number(rawFromStorage);
            if (rawFromStorage && Number.isInteger(parsedFromStorage) && parsedFromStorage > 0) {
                resolvedUserId = parsedFromStorage;
                console.log("[homePage] UserId from localStorage:", resolvedUserId);
            } else {
                console.warn("[homePage] localStorage userId is missing or invalid.", rawFromStorage);
            }
        }

        if (!resolvedUserId && window.authSignInResult && window.authSignInResult.userId) {
            var parsedFromSignInResult = Number(window.authSignInResult.userId);
            if (Number.isInteger(parsedFromSignInResult) && parsedFromSignInResult > 0) {
                resolvedUserId = parsedFromSignInResult;
                console.log("[homePage] UserId from authSignInResult:", resolvedUserId);
            }
        }

        return resolvedUserId;
    }

    async function createOrderCode() {

        var createButton = byId("btncreateOrderCode");
        var orderCodeInput = byId("orderCodeinput");

        if (!createButton || !orderCodeInput) {
            console.error("[homePage] Missing #btncreateOrderCode or #orderCodeinput.");
            return;
        }

        var orderCode = String(orderCodeInput.value || "").trim();
        if (!orderCode) {
            showHomeToast("Vui lòng nhập mã đơn hàng.", "warning");
            orderCodeInput.focus();
            return;
        }

        var userId = resolveCurrentUserId();

        if (!userId) {
            showHomeToast("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.", "warning");
            console.error("[homePage] Cannot create order code because UserId cannot be resolved from existing auth sources.");
            return;
        }

        var antiForgeryToken = readAntiForgeryToken();
        var body = new URLSearchParams({
            orderCode: orderCode,
            userId: String(userId)
        });

        pageState.isCreatingOrder = true;
        setCreateButtonState(createButton, true);

        if (typeof window.showGlobalLoading === "function") {
            window.showGlobalLoading("Processing...");
        }

        console.log("[homePage] Sending create order request", { orderCode: orderCode, userId: userId });
        showLoading();
        var CheckCodeExisting = await loadOrderData(userId, orderCode)
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

        if (!CheckCodeExisting) {
            fetch(CREATE_ORDER_URL, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "RequestVerificationToken": antiForgeryToken
                },
                body: body.toString()
            })
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error("HTTP " + response.status);
                    }
                    return response.json();
                })
                .then(function (data) {
                    console.log("[homePage] Create order response", data);

                    if (data && data.success) {
                        showHomeToast(data.message || "Tạo mã đơn hàng thành công.", "success");
                        hideLoading();
                        return;
                    }
                    hideLoading();
                    showHomeToast((data && data.message) ? data.message : "Tạo mã đơn hàng thất bại.", "error");
                })
                .catch(function (error) {
                    hideLoading();
                    console.error("[homePage] Create order failed", error);
                    showHomeToast("Không thể tạo mã đơn hàng. Vui lòng thử lại.", "error");
                    setCreateButtonState(createButton, false);

                })
                .finally(function () {
                    pageState.isCreatingOrder = false;
                    setCreateButtonState(createButton, false);
                    if (typeof window.hideGlobalLoading === "function") {
                        window.hideGlobalLoading();
                    }
                    hideLoading();
                    setCreateButtonState(createButton, false);

                });
        } else {
            showHomeToast("Mã đơn hàng đã tồn tại. Vui lòng tạo mã khác", "error");
            hideLoading();
            setCreateButtonState(createButton, false);

        }
        
    }

    document.addEventListener("click", function (event) {
        var target = event.target;

        var navLink = target.closest('a[href^="#"]');
        if (navLink) {
            var href = navLink.getAttribute("href");
            if (href && href.length > 1) {
                var destination = document.querySelector(href);
                if (destination) {
                    event.preventDefault();
                    destination.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            }
        }

        var createBtn = target.closest("#btncreateOrderCode");
        if (createBtn) {
            event.preventDefault();
            createOrderCode();
            return;
        }

        var button = target.closest(".learn-more-btn");
        if (!button) {
            return;
        }

        var title = button.getAttribute("data-card-title") || "Feature";
        

        showHomeToast(message, "info");
    });

    function init() {
        if (pageState.initialized) {
            return;
        }

        pageState.initialized = true;
        console.log("[homePage] Initialized.");

    }

    window.homePage = {
        init: init,
    };

    document.addEventListener("DOMContentLoaded", function () {
        window.homePage.init();
    });
})(window, document);