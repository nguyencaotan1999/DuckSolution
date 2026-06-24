/**
 * Cage / weight calculation table.
 * Handles dynamic row creation, input changes and real-time totals.
 */
namespace CageCalculation {
    /** Reads an input's value as a number, treating blank/invalid as 0. */
    function parseValue(input: HTMLInputElement): number {
        const value = parseFloat(input.value);
        return Number.isFinite(value) ? value : 0;
    }

    /** Formats a number for the summary fields (drops trailing zeros). */
    function formatTotal(total: number): string {
        return Number(total.toFixed(2)).toString();
    }

    class CageTable {
        private readonly tableBody: HTMLTableSectionElement;
        private readonly addRowBtn: HTMLButtonElement;
        private readonly totalCageNumber: HTMLInputElement;
        private readonly totalWeight: HTMLInputElement;
        private readonly rowCount: HTMLElement;

        constructor() {
            this.tableBody = this.require<HTMLTableSectionElement>("cageTableBody");
            this.addRowBtn = this.require<HTMLButtonElement>("addRowBtn");
            this.totalCageNumber = this.require<HTMLInputElement>("totalCageNumber");
            this.totalWeight = this.require<HTMLInputElement>("totalWeight");
            this.rowCount = this.require<HTMLElement>("rowCount");
        }

        /** Wires up events and seeds the table with one empty row. */
        public init(): void {
            this.addRowBtn.addEventListener("click", () => this.addRow());

            // Event delegation: recalculate on any input change inside the table.
            this.tableBody.addEventListener("input", () => this.recalculate());

            // Delegate row removal.
            this.tableBody.addEventListener("click", (e: Event) => {
                const target = e.target as HTMLElement;
                const removeBtn = target.closest<HTMLButtonElement>(".cage-row__remove");
                if (removeBtn) {
                    removeBtn.closest("tr")?.remove();
                    this.renumberRows();
                    this.recalculate();
                }
            });

            this.addRow();
        }

        /** Appends a new editable row to the table. */
        private addRow(): void {
            const index = this.tableBody.rows.length + 1;

            const row = document.createElement("tr");
            row.innerHTML = `
                <td class="cage-row__index">${index}</td>
                <td>
                    <input type="number" class="form-control cage-input cage-cage-number"
                           min="0" step="1" placeholder="0" aria-label="Cage number"  />
                </td>
                <td>
                    <input type="number" class="form-control cage-input cage-weight"
                           min="0" step="any" placeholder="0" aria-label="Weight"/>
                </td>
                <td>
                    <button type="button" class="btn btn-outline-danger cage-row__remove"
                            aria-label="Remove row" title="Xóa dòng">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>`;

            this.tableBody.appendChild(row);
            this.renumberRows();

            // Focus the new row's first input for quick data entry.
            row.querySelector<HTMLInputElement>(".cage-cage-number")?.focus();
        }

        /** Re-syncs the STT column and the row counter after add/remove. */
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

        /** Sums both columns and updates the summary fields. */
        private recalculate(): void {
            let cageTotal = 0;
            let weightTotal = 0;

            this.tableBody
                .querySelectorAll<HTMLInputElement>(".cage-cage-number")
                .forEach((input) => (cageTotal += parseValue(input)));

            this.tableBody
                .querySelectorAll<HTMLInputElement>(".cage-weight")
                .forEach((input) => (weightTotal += parseValue(input)));

            this.totalCageNumber.value = formatTotal(cageTotal);
            this.totalWeight.value = formatTotal(weightTotal);
        }

        /** Gets a required element by id or throws a clear error. */
        private require<T extends HTMLElement>(id: string): T {
            const el = document.getElementById(id) as T | null;
            if (!el) {
                throw new Error(`CageCalculation: missing element #${id}`);
            }
            return el;
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        // Only initialise on pages that actually contain the cage table.
        if (document.getElementById("cageTableBody")) {
            new CageTable().init();
        }
    });
}
