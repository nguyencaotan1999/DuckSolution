document.addEventListener("DOMContentLoaded", function () {
    const OPEN_CLASS = "is-open";
    const OVERLAY_VISIBLE_CLASS = "is-visible";
    const BODY_OPEN_CLASS = "sidebar-open";

    const menuToggle = document.getElementById("sidebarToggle") || document.getElementById("menuToggle");
    const sidebar = document.getElementById("appSidebar");
    const sidebarClose = document.getElementById("sidebarClose");
    const sidebarBackdrop = document.getElementById("sidebarOverlay") || document.getElementById("sidebarBackdrop");
    const navItems = document.querySelectorAll(".nav-item");
    const acRange = document.getElementById("acRange");
    const acValue = document.getElementById("acValue");
    const acGaugeFill = document.getElementById("acGaugeFill");
    const acSwitch = document.getElementById("acSwitch");

    function isDesktop() {
        return window.innerWidth >= 992;
    }

    function openSidebar() {
        if (!sidebar) return;

        sidebar.classList.add(OPEN_CLASS);
        if (sidebarBackdrop) sidebarBackdrop.classList.add(OVERLAY_VISIBLE_CLASS);
        document.body.classList.add(BODY_OPEN_CLASS);
        if (menuToggle) {
            menuToggle.setAttribute("aria-expanded", "true");
        }
    }

    function closeSidebar() {
        if (!sidebar) return;

        sidebar.classList.remove(OPEN_CLASS);
        if (sidebarBackdrop) sidebarBackdrop.classList.remove(OVERLAY_VISIBLE_CLASS);
        document.body.classList.remove(BODY_OPEN_CLASS);
        if (menuToggle) {
            menuToggle.setAttribute("aria-expanded", "false");
        }
    }

    function toggleSidebar() {
        if (!sidebar) return;

        if (sidebar.classList.contains(OPEN_CLASS)) {
            closeSidebar();
            return;
        }

        openSidebar();
    }

    // Prevent duplicate sidebar registrations when export-calculation.js is also loaded.
    if (sidebar && menuToggle && sidebarBackdrop && !window.__duckSidebarInitialized) {
        menuToggle.addEventListener("click", function () {
            if (isDesktop()) {
                return;
            }
            toggleSidebar();
        });

        sidebarBackdrop.addEventListener("click", function () {
            closeSidebar();
        });

        sidebar.querySelectorAll(".sidebar-link").forEach(function (link) {
            link.addEventListener("click", function () {
                if (!isDesktop()) {
                    closeSidebar();
                }
            });
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                closeSidebar();
            }
        });

        window.addEventListener("resize", function () {
            if (isDesktop()) {
                closeSidebar();
            }
        });

        window.__duckSidebarInitialized = true;
    }

    if (sidebarClose) {
        sidebarClose.addEventListener("click", closeSidebar);
    }

    navItems.forEach(function (item) {
        item.addEventListener("click", function () {
            navItems.forEach(function (nav) { nav.classList.remove("active"); });
            item.classList.add("active");
            if (!isDesktop()) {
                closeSidebar();
            }
        });
    });

    function updateAcUI() {
        if (!acRange || !acValue || !acGaugeFill) return;

        const min = Number(acRange.min || 16);
        const max = Number(acRange.max || 30);
        const value = Number(acRange.value || 17);
        const percentage = ((value - min) / (max - min)) * 100;

        acValue.textContent = value + "°C";
        acGaugeFill.style.height = Math.max(10, percentage) + "%";

        if (acSwitch && !acSwitch.checked) {
            acGaugeFill.style.opacity = "0.25";
            acValue.style.opacity = "0.45";
            acRange.disabled = true;
        } else {
            acGaugeFill.style.opacity = "1";
            acValue.style.opacity = "1";
            acRange.disabled = false;
        }
    }

    if (acRange) {
        acRange.addEventListener("input", updateAcUI);
    }

    if (acSwitch) {
        acSwitch.addEventListener("change", updateAcUI);
    }

    updateAcUI();
});