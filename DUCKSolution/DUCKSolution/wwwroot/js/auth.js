(function (window, document) {
    "use strict";

    var AUTH_KEY = "loggedInUserId";

    function setButtonLoading(buttonId, loadingText) {
        var btn = document.getElementById(buttonId);
        if (!btn) {
            return;
        }

        btn.dataset.originalValue = btn.textContent || btn.value || "";
        btn.disabled = true;

        if (btn.tagName.toLowerCase() === "input") {
            btn.value = loadingText;
        } else {
            btn.textContent = loadingText;
        }
    }

    function wireSubmitLoading(formSelector, buttonId, loadingText) {
        var form = document.querySelector(formSelector);
        if (!form) {
            return;
        }

        form.addEventListener("submit", function () {
            setButtonLoading(buttonId, loadingText);
        });
    }

    function clearClientAuthState() {
        window.localStorage.removeItem(AUTH_KEY);
    }

    function handleSignInResult() {
        if (!window.authSignInResult || !window.authSignInResult.userId) {
            return;
        }

        var userId = Number(window.authSignInResult.userId);
        if (!Number.isInteger(userId) || userId <= 0) {
            return;
        }

        window.localStorage.setItem(AUTH_KEY, String(userId));

        var redirectUrl = window.authSignInResult.redirectUrl || "/Admin/BoxCalculationPage";
        window.setTimeout(function () {
            window.location.href = redirectUrl;
        }, 600);
    }

    function logout(onDone) {
        clearClientAuthState();
        if (typeof onDone === "function") {
            onDone();
        }
    }

    function wireLogoutForm() {
        var logoutForm = document.getElementById("sidebarLogoutForm");
        var logoutButton = document.getElementById("sidebarLogoutButton");
        if (!logoutForm || !logoutButton || logoutForm.dataset.logoutBound === "true") {
            return;
        }

        logoutForm.dataset.logoutBound = "true";
        logoutForm.addEventListener("submit", function () {
            clearClientAuthState();
        });

        logoutButton.addEventListener("click", function (event) {
            event.preventDefault();
            clearClientAuthState();
            logoutForm.submit();
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        wireSubmitLoading("form[asp-action='SignInPage'], form[action*='SignInPage']", "signInSubmitBtn", "Đang đăng nhập...");
        wireSubmitLoading("form[asp-action='SignUpPage'], form[action*='SignUpPage']", "signUpSubmitBtn", "Đang đăng ký...");
        handleSignInResult();
        wireLogoutForm();
    });

    window.AppAuth = {
        logout: logout
    };
})(window, document);
