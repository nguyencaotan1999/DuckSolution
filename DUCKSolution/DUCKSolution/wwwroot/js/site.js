document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("appSidebar");
    const sidebarClose = document.getElementById("sidebarClose");
    const sidebarBackdrop = document.getElementById("sidebarBackdrop");
    const navItems = document.querySelectorAll(".nav-item");
    const acRange = document.getElementById("acRange");
    const acValue = document.getElementById("acValue");
    const acGaugeFill = document.getElementById("acGaugeFill");
    const acSwitch = document.getElementById("acSwitch");

    function openSidebar() {
        if (!sidebar) return;
        sidebar.classList.add("show");
        if (sidebarBackdrop) sidebarBackdrop.classList.add("show");
        document.body.style.overflow = "hidden";
    }

    function closeSidebar() {
        if (!sidebar) return;
        sidebar.classList.remove("show");
        if (sidebarBackdrop) sidebarBackdrop.classList.remove("show");
        document.body.style.overflow = "";
    }

    if (menuToggle) {
        menuToggle.addEventListener("click", openSidebar);
    }

    if (sidebarClose) {
        sidebarClose.addEventListener("click", closeSidebar);
    }

    if (sidebarBackdrop) {
        sidebarBackdrop.addEventListener("click", closeSidebar);
    }

    navItems.forEach(function (item) {
        item.addEventListener("click", function () {
            navItems.forEach(function (nav) { nav.classList.remove("active"); });
            item.classList.add("active");
            if (window.innerWidth < 992) {
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

    window.addEventListener("resize", function () {
        if (window.innerWidth >= 992) {
            if (sidebar) sidebar.classList.remove("show");
            if (sidebarBackdrop) sidebarBackdrop.classList.remove("show");
            document.body.style.overflow = "";
        }
    });

    updateAcUI();
});