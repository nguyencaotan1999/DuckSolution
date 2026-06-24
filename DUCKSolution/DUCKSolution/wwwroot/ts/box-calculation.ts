/**
 * Box (lồng) calculation page.
 * Place: wwwroot/ts/box-calculation.ts  (compiled into wwwroot/js/export-calculation.js).
 *
 * Flow:
 *   1. Fetch Data -> GET /Admin/GetBoxData?orderCode=...  (toast on success/error).
 *   2. On success: render editable rows + summary from the response.
 *   3. Add/edit rows; totals recompute live.
 *   4. Save Data  -> POST /Admin/SaveBoxData (JSON + anti-forgery header), inside a DB transaction.
 */
namespace BoxCalculation {
    interface BoxRow {
        stt: number;
        boxNubmer: number;
        boxWeight: number;
    }

    interface FetchResponse {
        success: boolean;
        message: string;
        totalBox?: number;
        totalBoxKg?: number;
        boxes?: BoxRow[];
    }

    interface SaveResponse {
        success: boolean;
        message: string;
        totalBox?: number;
        totalBoxKg?: number;
    }

    /** Reads an input's value as a number, treating blank/invalid as 0. */
    function parseValue(input: HTMLInputElement): number {
        const value = parseFloat(input.value);
        return Number.isFinite(value) ? value : 0;
    }

    /** Formats a number for display (drops trailing zeros). */
    function formatTotal(total: number): string {
        return Number(total.toFixed(2)).toString();
    }

    /** Minimal Bootstrap 5 toast helper. */
    function showToast(message: string, kind: "success" | "error"): void {
        const container = document.getElementById("toastContainer");
        if (!container) {
            return;
        }

        const bg = kind === "success" ? "text-bg-success" : "text-bg-danger";
        const icon = kind === "success" ? "bi-check-circle" : "bi-exclamation-triangle";

        const toast = document.createElement("div");
        toast.className = `toast align-items-center ${bg} border-0`;
        toast.setAttribute("role", "alert");
        toast.setAttribute("aria-live", "assertive");
        toast.setAttribute("aria-atomic", "true");
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body"><i class="bi ${icon} me-2"></i>${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto"
                        data-bs-dismiss="toast" aria-label="Close"></button>
            </div>`;

        container.appendChild(toast);

        // bootstrap is loaded globally via the bundle in _Layout.
        const w = window as any;
        if (w.bootstrap && w.bootstrap.Toast) {
            const instance = new w.bootstrap.Toast(toast, { delay: 4000 });
            toast.addEventListener("hidden.bs.toast", () => toast.remove());
            instance.show();
        } else {
            // Fallback if Bootstrap JS is unavailable.
            window.setTimeout(() => toast.remove(), 4000);
        }
    }

    class BoxTable {
        private readonly orderCode: HTMLInputElement;
        private readonly fetchBtn: HTMLButtonElement;
        private readonly addRowBtn: HTMLButtonElement;
        private readonly saveBtn: HTMLButtonElement;
        private readonly panel: HTMLElement;
        private readonly tableBody: HTMLTableSectionElement;
        private readonly totalBox: HTMLInputElement;
        private readonly totalBoxKg: HTMLInputElement;
        private readonly rowCount: HTMLElement;

        /** The order code that was actually loaded (guards Save against an edited textbox). */
        private loadedOrderCode = "";

        constructor() {
            this.orderCode = this.require<HTMLInputElement>("orderCode");
            this.fetchBtn = this.require<HTMLButtonElement>("fetchDataBtn");
            this.addRowBtn = this.require<HTMLButtonElement>("boxAddRowBtn");
            this.saveBtn = this.require<HTMLButtonElement>("saveDataBtn");
            this.panel = this.require<HTMLElement>("boxPanel");
            this.tableBody = this.require<HTMLTableSectionElement>("boxTableBody");
            this.totalBox = this.require<HTMLInputElement>("totalBox");
            this.totalBoxKg = this.require<HTMLInputElement>("totalBoxKg");
            this.rowCount = this.require<HTMLElement>("boxRowCount");
        }

        public init(): void {
            this.fetchBtn.addEventListener("click", () => void this.fetchData());

            // Enter in the order-code box triggers a fetch.
            this.orderCode.addEventListener("keydown", (e: KeyboardEvent) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    void this.fetchData();
                }
            });

            this.addRowBtn.addEventListener("click", () => this.addRow());
            this.saveBtn.addEventListener("click", () => void this.saveData());

            // Live totals on any input change.
            this.tableBody.addEventListener("input", () => this.recalculate());

            // Row removal.
            this.tableBody.addEventListener("click", (e: Event) => {
                const removeBtn = (e.target as HTMLElement).closest<HTMLButtonElement>(".box-row__remove");
                if (removeBtn) {
                    removeBtn.closest("tr")?.remove();
                    this.renumberRows();
                    this.recalculate();
                }
            });
        }

        /** GET the order + boxes and populate the table. */
        private async fetchData(): Promise<void> {
            const code = this.orderCode.value.trim();
            if (!code) {
                showToast("Vui lòng nhập mã đơn hàng.", "error");
                return;
            }

            try {
                const url = `/Admin/GetBoxData?orderCode=${encodeURIComponent(code)}`;
                const res = await fetch(url, { headers: { "Accept": "application/json" } });
                const data: FetchResponse = await res.json();

                if (!data.success) {
                    this.panel.classList.add("d-none");
                    showToast(data.message, "error");
                    return;
                }

                this.loadedOrderCode = code;
                this.renderRows(data.boxes ?? []);
                this.panel.classList.remove("d-none");
                showToast(data.message, "success");
            } catch {
                showToast("Không thể kết nối tới máy chủ.", "error");
            }
        }

        /** Rebuilds the table body from fetched rows (or one blank row if none). */
        private renderRows(boxes: BoxRow[]): void {
            this.tableBody.innerHTML = "";
            if (boxes.length === 0) {
                this.addRow();
                return;
            }
            boxes.forEach((b) => this.addRow(b.boxNubmer, b.boxWeight));
            this.recalculate();
        }

        /** Appends an editable row, optionally pre-filled. */
        private addRow(boxNubmer?: number, boxWeight?: number): void {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td class="box-row__index"></td>
                <td>
                    <input type="number" class="form-control box-input box-number"
                           min="0" step="1" placeholder="0" aria-label="Số Lồng"
                           value="${boxNubmer ?? ""}" />
                </td>
                <td>
                    <input type="number" class="form-control box-input box-weight"
                           min="0" step="any" placeholder="0" aria-label="Số Ký"
                           value="${boxWeight ?? ""}" />
                </td>
                <td>
                    <button type="button" class="btn btn-sm btn-outline-danger box-row__remove"
                            aria-label="Xóa dòng" title="Xóa dòng">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>`;

            this.tableBody.appendChild(row);
            this.renumberRows();
            this.recalculate();
        }

        /** Re-syncs STT column + the row counter. */
        private renumberRows(): void {
            const rows = this.tableBody.rows;
            for (let i = 0; i < rows.length; i++) {
                const cell = rows[i].cells[0];
                if (cell) {
                    cell.textContent = (i + 1).toString();
                }
            }
            this.rowCount.textContent = rows.length.toString();
        }

        /** Sums both columns into the summary fields. */
        private recalculate(): void {
            let boxTotal = 0;
            let weightTotal = 0;

            this.tableBody.querySelectorAll<HTMLInputElement>(".box-number")
                .forEach((input) => (boxTotal += parseValue(input)));
            this.tableBody.querySelectorAll<HTMLInputElement>(".box-weight")
                .forEach((input) => (weightTotal += parseValue(input)));

            this.totalBox.value = formatTotal(boxTotal);
            this.totalBoxKg.value = formatTotal(weightTotal);
        }

        /** Collects rows and POSTs them for a transactional save. */
        private async saveData(): Promise<void> {
            if (!this.loadedOrderCode) {
                showToast("Vui lòng tải dữ liệu đơn hàng trước khi lưu.", "error");
                return;
            }

            const rows: BoxRow[] = [];
            let invalid = false;

            this.tableBody.querySelectorAll<HTMLTableRowElement>("tr").forEach((tr, index) => {
                const numberInput = tr.querySelector<HTMLInputElement>(".box-number");
                const weightInput = tr.querySelector<HTMLInputElement>(".box-weight");
                if (!numberInput || !weightInput) {
                    return;
                }

                const boxNubmer = parseValue(numberInput);
                const boxWeight = parseValue(weightInput);

                if (boxNubmer < 0 || boxWeight < 0) {
                    invalid = true;
                }

                rows.push({ stt: index + 1, boxNubmer, boxWeight });
            });

            if (invalid) {
                showToast("Giá trị Số Lồng / Số Ký không được âm.", "error");
                return;
            }

            const token = (document.querySelector(
                'input[name="__RequestVerificationToken"]'
            ) as HTMLInputElement | null)?.value ?? "";

            try {
                this.saveBtn.disabled = true;
                const res = await fetch("/Admin/SaveBoxData", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "RequestVerificationToken": token
                    },
                    body: JSON.stringify({ orderCode: this.loadedOrderCode, rows })
                });
                const data: SaveResponse = await res.json();

                if (data.success) {
                    if (typeof data.totalBox === "number") {
                        this.totalBox.value = formatTotal(data.totalBox);
                    }
                    if (typeof data.totalBoxKg === "number") {
                        this.totalBoxKg.value = formatTotal(data.totalBoxKg);
                    }
                    showToast(data.message, "success");
                } else {
                    showToast(data.message, "error");
                }
            } catch {
                showToast("Không thể lưu dữ liệu. Vui lòng thử lại.", "error");
            } finally {
                this.saveBtn.disabled = false;
            }
        }

        private require<T extends HTMLElement>(id: string): T {
            const el = document.getElementById(id) as T | null;
            if (!el) {
                throw new Error(`BoxCalculation: missing element #${id}`);
            }
            return el;
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        // Only initialise on the box calculation page.
        if (document.getElementById("boxTableBody")) {
            new BoxTable().init();
        }
    });
}
