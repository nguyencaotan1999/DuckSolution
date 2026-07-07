(function (window, document) {
    "use strict";

    var helper = window.CalculationStorageHelper;

    var pageState = {
        initialized: false,
        userId: null,
        autosaveTimerId: 0
    };

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

        var button = target.closest(".learn-more-btn");
        if (!button) {
            return;
        }

        var title = button.getAttribute("data-card-title") || "Feature";
        var message = "You clicked Learn More on " + title + ".";
        //window.showSuccessToast("Đã khôi phục dữ liệu nháp từ localStorage.");
        //if (title === 'Data Management') {
        //    var orderCode = document.getElementById("orderCodeinput");
        //    pageState.userId = helper.requireLoggedInOrRedirect("/Admin/SignInPage", "boxDraftStatusHost");
        //    if (orderCode !== null || userId !== 0) {


        //    } else {
        //        if (orderCode === "") {
        //        //    window.showWarningToast("Vui Lòng nhập mã đơn hàng.");
        //        }
        //        else {
        //        //    window.showWarningToast("Vui Lòng đăng nhập trước khi tạo");
        //        }
                
        //    }
        //}

        var container = document.getElementById("homeToastContainer");
        if (!container) {
            alert(message);
            return;
        }

        var toastEl = document.createElement("div");
        toastEl.className = "toast align-items-center text-bg-dark border-0";
        toastEl.setAttribute("role", "alert");
        toastEl.setAttribute("aria-live", "assertive");
        toastEl.setAttribute("aria-atomic", "true");
        toastEl.innerHTML =
            '<div class="d-flex">' +
            '<div class="toast-body">' + message + '</div>' +
            '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>' +
            '</div>';

        container.appendChild(toastEl);

        if (window.bootstrap && window.bootstrap.Toast) {
            var toast = new window.bootstrap.Toast(toastEl, { delay: 2600 });
            toastEl.addEventListener("hidden.bs.toast", function () {
                toastEl.remove();
            });
            toast.show();
        } else {
            alert(message);
            toastEl.remove();
        }
    });
    function init() {

    }

    window.homePage = {
        init: init,
    };

    document.addEventListener("DOMContentLoaded", function () {
        window.homePage.init();
    });
})(window, document);