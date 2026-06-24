/**
 * Duck export calculation table.
 * Place: wwwroot/ts/duck-calculation.ts  (compiled into wwwroot/js/export-calculation.js).
 *
 * Per-row columns: STT | Mã 1..5 | Total Weight of 5 Codes | Total Number of Ducks for 5 Codes.
 *   - Total Weight of 5 Codes      = sum of the 5 entered code values.
 *   - Total Number of Ducks (row)  = ducksPerCage × cagesPerWeighing × (number of filled codes).
 *
 * Global summary: Total Weight (Σ of the weight column) and Total Number of Ducks (Σ of the ducks column).
 */
namespace DuckCalculation {
    const CODE_COUNT = 5;
    const CODE_MAX_DIGITS = 5;   // Mã 1..5: max 5 digits each
    const GLOBAL_MAX_DIGITS = 2; // ducks-per-cage & cages-per-weighing: max 2 digits

    /** Reads an input's value as a number, treating blank/invalid as 0. */
    function parseValue(input: HTMLInputElement): number {
        const value = parseFloat(input.value);
        return Number.isFinite(value) ? value : 0;
    }

    /** A code counts as "filled" when the user has typed something into it. */
    function isFilled(input: HTMLInputElement): boolean {
        return input.value.trim() !== "";
    }

    /** Caps a numeric input to a maximum number of digits (type=number ignores maxlength). */
    function limitDigits(input: HTMLInputElement, maxDigits: number): void {
        if (input.value.length > maxDigits) {
            input.value = input.value.slice(0, maxDigits);
        }
    }

    /** Formats a number for display (drops trailing zeros). */
    function formatTotal(total: number): string {
        return Number(total.toFixed(2)).toString();
    }

    class DuckTable {
        private readonly tableBody: HTMLTableSectionElement;
        private readonly addRowBtn: HTMLButtonElement;
        private readonly ducksPerCage: HTMLInputElement;
        private readonly cagesPerWeighing: HTMLInputElement;
        private readonly totalWeight: HTMLInputElement;
        private readonly totalDucks: HTMLInputElement;
        private readonly rowCount: HTMLElement;

        constructor() {
            this.tableBody = this.require<HTMLTableSectionElement>("duckTableBody");
            this.addRowBtn = this.require<HTMLButtonElement>("duckAddRowBtn");
            this.ducksPerCage = this.require<HTMLInputElement>("ducksPerCage");
            this.cagesPerWeighing = this.require<HTMLInputElement>("cagesPerWeighing");
            this.totalWeight = this.require<HTMLInputElement>("totalWeight");
            this.totalDucks = this.require<HTMLInputElement>("totalDucks");
            this.rowCount = this.require<HTMLElement>("duckRowCount");
        }

        /** Wires up events and seeds the table with one empty row. */
        public init(): void {
            this.addRowBtn.addEventListener("click", () => this.addRow());

            // Recalculate whenever any code input changes (event delegation).
            this.tableBody.addEventListener("input", (e: Event) => {
                const target = e.target as HTMLElement;
                if (target.classList.contains("duck-code")) {
                    limitDigits(target as HTMLInputElement, CODE_MAX_DIGITS);
                }
                this.recalculate();
            });

            // Delegate row removal.
            this.tableBody.addEventListener("click", (e: Event) => {
                const removeBtn = (e.target as HTMLElement).closest<HTMLButtonElement>(".duck-row__remove");
                if (removeBtn) {
                    removeBtn.closest("tr")?.remove();
                    this.renumberRows();
                    this.recalculate();
                }
            });

            // The two global inputs affect every row's duck total.
            [this.ducksPerCage, this.cagesPerWeighing].forEach((input) => {
                input.addEventListener("input", () => {
                    limitDigits(input, GLOBAL_MAX_DIGITS);
                    this.recalculate();
                });
            });

            this.addRow();
        }

        /** Appends a new editable row to the table. */
        private addRow(): void {
            const row = document.createElement("tr");

            // Build the five code inputs.
            let codeCells = "";
            for (let i = 1; i <= CODE_COUNT; i++) {
                codeCells += `
                <td>
                    <input type="number" class="form-control duck-input duck-code"
                           min="0" step="1" placeholder="0" aria-label="Mã ${i}" />
                </td>`;
            }

            row.innerHTML = `
                <td class="duck-row__index">
                    <span class="duck-row__no"></span>
                </td>
                ${codeCells}
                <td class="duck-row__weight">0</td>
                <td class="duck-row__ducks">0</td>`;

            this.tableBody.appendChild(row);
            this.renumberRows();
            this.recalculate();

            // Focus the new row's first code for quick data entry.
            row.querySelector<HTMLInputElement>(".duck-code")?.focus();
        }

        /** Re-syncs the STT column and the row counter after add/remove. */
        private renumberRows(): void {
            const rows = this.tableBody.rows;
            for (let i = 0; i < rows.length; i++) {
                const noCell = rows[i].querySelector(".duck-row__no");
                if (noCell) {
                    noCell.textContent = (i + 1).toString();
                }
            }
            this.rowCount.textContent = rows.length.toString();
        }

        /** Recomputes every row plus the two grand totals. */
        private recalculate(): void {
            const perCage = parseValue(this.ducksPerCage);
            const perWeighing = parseValue(this.cagesPerWeighing);
            const ducksPerFilledCode = perCage * perWeighing;

            let grandWeight = 0;
            let grandDucks = 0;

            const rows = this.tableBody.rows;
            for (let i = 0; i < rows.length; i++) {
                const codes = rows[i].querySelectorAll<HTMLInputElement>(".duck-code");

                let rowWeight = 0;
                let filledCount = 0;
                codes.forEach((code) => {
                    rowWeight += parseValue(code);
                    if (isFilled(code)) {
                        filledCount++;
                    }
                });

                const rowDucks = ducksPerFilledCode * filledCount;

                const weightCell = rows[i].querySelector(".duck-row__weight");
                const ducksCell = rows[i].querySelector(".duck-row__ducks");
                if (weightCell) {
                    weightCell.textContent = formatTotal(rowWeight);
                }
                if (ducksCell) {
                    ducksCell.textContent = formatTotal(rowDucks);
                }

                grandWeight += rowWeight;
                grandDucks += rowDucks;
            }

            this.totalWeight.value = formatTotal(grandWeight);
            this.totalDucks.value = formatTotal(grandDucks);
        }

        /** Gets a required element by id or throws a clear error. */
        private require<T extends HTMLElement>(id: string): T {
            const el = document.getElementById(id) as T | null;
            if (!el) {
                throw new Error(`DuckCalculation: missing element #${id}`);
            }
            return el;
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        // Only initialise on pages that contain the duck calculation table.
        if (document.getElementById("duckTableBody")) {
            new DuckTable().init();
        }
    });
}
