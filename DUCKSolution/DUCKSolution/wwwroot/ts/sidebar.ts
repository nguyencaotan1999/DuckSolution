/**
 * Sidebar navigation behaviour.
 * Place: wwwroot/ts/sidebar.ts  (compiled into wwwroot/js/export-calculation.js).
 *
 * Responsibilities:
 *   - Toggle the off-canvas sidebar on mobile (hamburger button).
 *   - Close the sidebar when the overlay is clicked, a link is tapped, or Esc is pressed.
 *   - Highlight the navigation tab that matches the current URL.
 */
namespace SidebarNav {
    const OPEN_CLASS = "is-open";
    const OVERLAY_VISIBLE_CLASS = "is-visible";
    const BODY_OPEN_CLASS = "sidebar-open";

    class Sidebar {
        private readonly sidebar: HTMLElement;
        private readonly overlay: HTMLElement;
        private readonly toggleBtn: HTMLElement;

        constructor(sidebar: HTMLElement, overlay: HTMLElement, toggleBtn: HTMLElement) {
            this.sidebar = sidebar;
            this.overlay = overlay;
            this.toggleBtn = toggleBtn;
        }

        public init(): void {
            // Hamburger toggles the menu.
            this.toggleBtn.addEventListener("click", () => this.toggle());

            // Clicking the dimmed overlay closes the menu.
            this.overlay.addEventListener("click", () => this.close());

            // Tapping a link closes the menu (relevant on mobile).
            this.sidebar.querySelectorAll<HTMLAnchorElement>(".sidebar-link").forEach((link) => {
                link.addEventListener("click", () => this.close());
            });

            // Escape key closes the menu.
            document.addEventListener("keydown", (e: KeyboardEvent) => {
                if (e.key === "Escape") {
                    this.close();
                }
            });

            this.highlightActiveLink();
        }

        private toggle(): void {
            this.sidebar.classList.contains(OPEN_CLASS) ? this.close() : this.open();
        }

        private open(): void {
            this.sidebar.classList.add(OPEN_CLASS);
            this.overlay.classList.add(OVERLAY_VISIBLE_CLASS);
            document.body.classList.add(BODY_OPEN_CLASS);
            this.toggleBtn.setAttribute("aria-expanded", "true");
        }

        private close(): void {
            this.sidebar.classList.remove(OPEN_CLASS);
            this.overlay.classList.remove(OVERLAY_VISIBLE_CLASS);
            document.body.classList.remove(BODY_OPEN_CLASS);
            this.toggleBtn.setAttribute("aria-expanded", "false");
        }

        /** Adds the `active` class to the link whose path best matches the current page. */
        private highlightActiveLink(): void {
            const currentPath = this.normalize(window.location.pathname);
            const links = Array.from(
                this.sidebar.querySelectorAll<HTMLAnchorElement>(".sidebar-link")
            );

            let best: HTMLAnchorElement | null = null;
            let bestLength = -1;

            for (const link of links) {
                const linkPath = this.normalize(new URL(link.href).pathname);

                // Exact match, or the longest link path that prefixes the current URL
                // (handles nested routes like /Cage/Details under the "Tính lồng" tab).
                const isMatch =
                    linkPath === currentPath ||
                    (linkPath !== "/" && currentPath.indexOf(linkPath + "/") === 0);

                if (isMatch && linkPath.length > bestLength) {
                    best = link;
                    bestLength = linkPath.length;
                }
            }

            if (best) {
                best.classList.add("active");
            }
        }

        /** Lowercases and strips a trailing slash so "/Home/" === "/home". */
        private normalize(path: string): string {
            const lower = path.toLowerCase();
            return lower.length > 1 && lower.endsWith("/") ? lower.slice(0, -1) : lower;
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        const sidebar = document.getElementById("appSidebar");
        const overlay = document.getElementById("sidebarOverlay");
        const toggleBtn = document.getElementById("sidebarToggle");

        if (sidebar && overlay && toggleBtn) {
            new Sidebar(sidebar, overlay, toggleBtn).init();
        }
    });
}
