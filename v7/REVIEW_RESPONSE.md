# V7 Dashboard — Stakeholder Review Response & Action Plan

**Date:** February 18, 2026  
**Prepared by:** Development Team  
**Status:** DRAFT — Pending approval before implementation  
**Total Questions:** 47 (SM: 18, GSA: 16, M&D: 13)

---

## Table of Contents

1. [DOC 1: Supplier Marketplace (18 Questions)](#doc-1-supplier-marketplace)
2. [DOC 2: Global Spend Analysis (16 Questions)](#doc-2-global-spend-analysis)
3. [DOC 3: Materials & Disciplines (13 Questions)](#doc-3-materials--disciplines)
4. [Cross-Tab Systemic Issues Summary](#cross-tab-systemic-issues)
5. [Implementation Priority Matrix](#implementation-priority-matrix)

---

## DOC 1: Supplier Marketplace

### SM-Q1: Add a Clear Button to Reset All Filters

**Reviewer Comment:** Add a "Clear" button on the main ribbon next to search — clears all filters, resets to default unfiltered state.

**Current Behavior:**  
- SM tab has NO Clear button in the filter bar (`v7/index.html` lines 66–113).
- GSA tab already has a Clear button (`v7/index.html` line 518) calling `clearGSAFilters()`.
- M&D tab also has NO Clear button.
- Users must manually reset each dropdown to "All …" individually.

**Root Cause:** Feature was implemented for GSA but not for SM or M&D.

**Planned Action:**
1. Add a `<button class="sm-clear-btn" onclick="clearSMFilters()">Clear</button>` in the SM filter row in `index.html`, positioned next to the search input.
2. Create `clearSMFilters()` function in `scripts.js` that:
   - Resets all 5 dropdowns (`filterEntity`, `filterProject`, `filterSupplier`, `filterStatus`, `filterMaterial`) to their "All" default values.
   - Clears the `searchInput` text field.
   - Resets `currentFilters` object to defaults.
   - Calls `applyFilters()` to refresh the dashboard.
3. Style button consistently with GSA's existing Clear button.

**Complexity:** Low  
**Files Changed:** `index.html`, `scripts.js`

---

### SM-Q2: Sort Entity Dropdown Alphabetically

**Reviewer Comment:** Sort "All Entities" filter dropdown in alphabetical order.

**Current Behavior:**  
- SM entities come from `smData.entities[]` array (19 items) in the order they appear in `sm_data.json`, which is sorted by quotation count descending (Yamauchi Gumi first, Gov Svcs last).
- Not alphabetically sorted.

**Root Cause:** `initFilters()` at `scripts.js` line 1340 iterates `smData.entities` without sorting.

**Planned Action:**
1. In `initFilters()`, sort the entities array alphabetically before populating the dropdown:
   ```js
   smData.entities.sort((a, b) => a.Entity.localeCompare(b.Entity))
   ```
2. Apply same alphabetical sorting to ALL SM dropdowns (entities, projects, suppliers, materials).

**Complexity:** Low  
**Files Changed:** `scripts.js`

---

### SM-Q3: Sort Projects Alphabetically + Add Type-Ahead Search

**Reviewer Comment:** Sort "All Projects" alphabetically + add search/type-ahead so users can type to find projects.

**Current Behavior:**  
- Projects are sorted by quotation count (descending), not alphabetically.
- Only projects with 2+ quotations are shown (filtering out many projects).
- Plain `<select>` element — no type-ahead capability.

**Root Cause:** Design choice to sort by count. Standard HTML `<select>` doesn't support type-ahead search.

**Planned Action:**
1. Sort projects alphabetically instead of by quotation count.
2. Remove the 2+ quotation threshold — show ALL projects.
3. Build a reusable `SearchableSelect` component (vanilla JS) that:
   - Wraps any `<select>` element.
   - Shows a text input at the top of the dropdown for filtering.
   - Filters options as user types (case-insensitive substring match).
   - Supports keyboard navigation.
4. Apply `SearchableSelect` to ALL dropdowns with 10+ options across all 3 tabs.

**Complexity:** Medium (new component)  
**Files Changed:** `scripts.js`, `styles.css`, `index.html`

---

### SM-Q4: Supplier List Incomplete — Only A-Names Visible

**Reviewer Comment:** Supplier list only showing names starting with "A". Show all suppliers, sort alphabetically, add type-ahead search.

**Current Behavior:**  
- SM supplier dropdown is populated from `gsaData.filters.suppliers` (falling back to `gsaData.supplierRankings.top`).
- GSA data caps suppliers at 200 entries (`scripts.js` line ~2970).
- The 200 cap combined with alphabetical order means only A/B names show.

**Root Cause:** Supplier list is capped at 200 entries AND sourced from GSA data instead of SM-specific data.

**Planned Action:**
1. Remove the 200-supplier cap.
2. Source supplier list from ALL unique suppliers in `smData.workbench` or `suppliersData.suppliers` (2,189 total).
3. Sort alphabetically.
4. Apply the `SearchableSelect` component (from SM-Q3) — essential for 2,000+ suppliers.
5. Truncate display names to ~40 chars in dropdown for readability.

**Complexity:** Low  
**Files Changed:** `scripts.js`

---

### SM-Q5: "All Materials" Filter Showing Disciplines Instead of Materials

**Reviewer Comment:** "All Materials" filter reads from wrong column — showing disciplines (~13) instead of actual materials (~30). Fix to show 30 materials, alphabetical, with type-ahead. Disciplines (13) should be in a separate filter.

**Current Behavior:**  
- SM Materials dropdown reads from `smData.materialsByDiscipline[].MaterialCode` — this field was renamed during DISCIPLINE_MAP consolidation.
- Shows 7 consolidated discipline categories instead of 30 raw material names.
- No separate Discipline filter on SM tab.

**Root Cause:** The Python data pipeline (`build_v7_data.py`) consolidates 27+ raw material names → 7 disciplines via `DISCIPLINE_MAP`. The consolidated values overwrite the original material names in the JSON output.

**Planned Action:**
1. **Data Pipeline Change** (`build_v7_data.py`): Preserve BOTH:
   - `material` = original raw material name (30 distinct values, e.g., "Mechanical Items", "Rental", "Firestop/DC 315", "Subcontract")
   - `discipline` = the 13 pre-consolidation Material Code categories
2. Add `filters.materials` (30 items) and `filters.disciplines` (13 items) as separate arrays in `sm_data.json`.
3. Update `initFilters()` to populate Materials dropdown from `filters.materials`.
4. Add a new Discipline dropdown to the SM filter bar in `index.html`.
5. Apply type-ahead to both dropdowns.
6. Regenerate all JSON data files.

**Complexity:** High (data pipeline + UI + JS changes)  
**Files Changed:** `build_v7_data.py`, `sm_data.json`, `gsa_data.json`, `md_data.json`, `index.html`, `scripts.js`

---

### SM-Q6: Search Filter Gives No Feedback

**Reviewer Comment:** Search filter gives no feedback on what it matched. Either show matched context (e.g., "Filtered by Project: BIOT-121…") or remove the search function.

**Current Behavior:**  
- SM search DOES work — there's a debounced `handleSearch()` at `scripts.js` line 1392 that filters `smData.workbench` by matching against concatenated fields: QuotationNumber, Entity, ProjectName, Description, Client.
- However, there is NO visual indicator showing: (a) that filtering is active, (b) how many results matched, or (c) which fields matched.

**Root Cause:** Search functionality exists but lacks user feedback/UX indicators.

**Planned Action:**
1. Add a "search results" indicator bar below the filter row:
   - When search is active: "Showing X of Y results for '[term]'"
   - When no search: bar is hidden.
2. Optionally highlight/badge which filter is currently active.
3. Clear the indicator when search is cleared or Clear button is pressed.

**Complexity:** Low  
**Files Changed:** `index.html`, `scripts.js`, `styles.css`

---

### SM-Q7: Status Bars Not Interactive

**Reviewer Comment:** Clicking a status bar (Order, Quotation, Waiting, Cancelled) should filter the rest of the dashboard by that status.

**Current Behavior:**  
- Status bars are rendered as styled `<div>` elements.
- NO click handlers — they are purely visual indicators.
- The Status dropdown filter exists and works, but clicking the visual status bars does nothing.

**Root Cause:** Status bars were designed as display-only, not interactive.

**Planned Action:**
1. Add `cursor: pointer` and `onclick` handlers to each status bar element.
2. On click: Set `filterStatus` dropdown to the clicked status value → call `handleFilterChange()` → `applyFilters()`.
3. Add hover effect (slight elevation/shadow) for visual affordance.
4. Highlight the active status bar with a border or background change.
5. Clicking an already-active status bar should toggle it off (reset to "All Statuses").

**Complexity:** Medium  
**Files Changed:** `scripts.js`, `styles.css`

---

### SM-Q8: Map Not Showing All Supplier Locations

**Reviewer Comment:** Map not showing all supplier locations in unfiltered view. Filtering by entity reveals locations not visible in the default view. Unfiltered map should show ALL locations.

**Current Behavior:**  
- Only ~20 of 2,189 suppliers have geocoded coordinates in `suppliers.json`.
- Unfiltered map uses `countryCoords` lookup (`scripts.js` lines 2422–2484) as fallback for country-level positioning.
- Not all country names in supplier data match `countryCoords` keys.
- `normalizeCountry()` is only applied locally inside `applyFilters()`, not on initial map render.

**Root Cause:** Incomplete geocoding + inconsistent country name matching + normalization not applied globally.

**Planned Action:**
1. Expand `countryCoords` dictionary to cover ALL countries present in the dataset.
2. Apply `normalizeCountry()` globally during data load (not just inside filter).
3. On unfiltered view: Aggregate suppliers by normalized country → show one circle per country with size proportional to supplier count.
4. Ensure entity-filtered views show locations by using `entityCountryMap` as additional fallback.
5. Add country count to marker tooltips (e.g., "UAE: 342 suppliers").

**Complexity:** Medium  
**Files Changed:** `scripts.js`

---

### SM-Q9: Supplier Profile Only Populates from Top 10 Click

**Reviewer Comment:** Supplier Profile should also populate when selecting a supplier from the filter dropdown, not just from Top 10 clicks.

**Current Behavior:**  
- `selectSupplier()` (line 2113) is triggered by Top 10 supplier clicks — works correctly.
- `selectSupplierByName()` (line 1101) is triggered from Supplier List table clicks — works correctly.
- When a supplier is selected from the **filter dropdown**, `applyFilters()` calls `updateSupplierProfile()` at line 1753 — **BUT this function is NEVER DEFINED**. It silently fails.

**Root Cause:** Bug — `updateSupplierProfile()` is called but never implemented.

**Planned Action:**
1. Define `updateSupplierProfile(supplierName)` that:
   - Finds the supplier in `suppliersData.suppliers` by name.
   - Populates the Supplier Profile card (name, location, rating, email, contact).
   - Uses the same rendering logic as `selectSupplierByName()`.
2. Call it from `applyFilters()` when a specific supplier is selected in the dropdown.
3. Also call it when clicking on chart elements (Entity, Material Distribution, etc.) — show the top supplier for that category.

**Complexity:** Low (function already partially implemented elsewhere)  
**Files Changed:** `scripts.js`

---

### SM-Q10: Entity Comparison Not Showing All Entities

**Reviewer Comment:** Only 5 entities visible. Clicking a bar should cross-filter the entire dashboard. Need to show all entities.

**Current Behavior:**  
- `renderEntityChartCanvas()` (`scripts.js` line 2753) renders a horizontal bar chart.
- Data comes from `smData.entities` (19 entities) — all should be rendered.
- If only 5 are showing, it may be a chart height/container sizing issue cutting off the rest.
- NO click handler — chart is non-interactive.

**Root Cause:** Chart container may have a fixed height that truncates. No click handlers implemented.

**Planned Action:**
1. Ensure chart height dynamically adjusts to show ALL entities (or add scrolling within chart container).
2. Verify all 19 entities are passed to Chart.js (data issue vs display issue).
3. Add `onClick` handler: Clicking an entity bar → set `filterEntity` dropdown → `applyFilters()`.
4. Highlight selected entity bar.

**Complexity:** Medium  
**Files Changed:** `scripts.js`, `styles.css`

---

### SM-Q11: Material Distribution Chart Shows Disciplines, Not Materials

**Reviewer Comment:** Showing disciplines (~7) not materials (~30). With ~30 materials, pie chart is recommended. Clicking should cross-filter.

**Current Behavior:**  
- Material Distribution chart reads from `smData.materialsByDiscipline` — 7 consolidated discipline categories.
- Chart currently supports 4 chart types via toggle (bar/pie/line/radar).
- No click handler.

**Root Cause:** Same DISCIPLINE_MAP issue as SM-Q5. Data source shows 7 disciplines instead of 30 materials.

**Planned Action:**
1. After data pipeline fix (SM-Q5), chart will automatically show 30 materials.
2. Default chart type → **pie chart** (reviewer recommendation for 30 categories).
3. For 30 items, use a doughnut chart with a scrollable legend to avoid overcrowding.
4. Add click handler: Clicking a segment → set Material filter → `applyFilters()`.
5. Ensure chart rebuilds with filtered data when filters change.

**Complexity:** Medium (depends on SM-Q5 data pipeline fix)  
**Files Changed:** `scripts.js`

---

### SM-Q12: Responsible MVL Employee Issues

**Reviewer Comment:** Remove search box (not working). Missing name on #1 — POs not tagged to a person. Only showing 10 — are there more? "BY SPEND" button unclear. Every PO should be tagged to a person in Microtrack.

**Current Behavior:**  
- Employee list shows top 10 employees by PO count.
- #1 has no name because those POs have blank/null `ResponsiblePerson` field in source data.
- There IS a search box within the employee section — unclear if functional.
- "BY SPEND" toggle switches ranking from PO count to spend amount.

**Planned Action:**
1. Display "Unassigned" instead of blank for employees with no name.
2. Remove or fix the employee section search box.
3. Add a "Show All" toggle to display all employees (not just top 10), with pagination if needed.
4. Add tooltip/info icon explaining "BY SPEND" = ranked by total PO value instead of PO count.
5. Flag blank employee records as a **data quality issue** — needs Microtrack cleanup.

**Complexity:** Low  
**Files Changed:** `scripts.js`

---

### SM-Q13: Top 10 Suppliers — Make Interactive + Missing Name

**Reviewer Comment:** Clicking should cross-filter Status, Entity Comparison, Map, Supplier Profile, Material Distribution, Responsible MVL Employee, Quotation-to-PO Time, Approved Materials. #7 missing supplier name. How is Approved Materials calculated?

**Current Behavior:**  
- Top 10 Suppliers chart has `onclick="selectSupplier(index)"` — but this ONLY updates the Supplier Profile card.
- No cross-filtering of other dashboard components.
- #7 has blank `SupplierName` in source data.
- Approved Materials is semi-hardcoded (see SM-Q15).

**Planned Action:**
1. Extend `selectSupplier()` to also:
   - Set `filterSupplier` dropdown to the clicked supplier name.
   - Call `applyFilters()` to cross-filter the entire dashboard.
2. Display "Unknown Supplier" for blank names.
3. Add visual affordance (hover effects, cursor pointer).
4. Approved Materials calculation → see SM-Q15.

**Complexity:** Medium  
**Files Changed:** `scripts.js`

---

### SM-Q14: Quotation-to-PO Time — Clarify Calculation

**Reviewer Comment:** Is it PO Date minus RFQ Date, averaged per month?

**Current Behavior:**  
- Chart shows monthly average conversion time in days.
- Values (~9–18 days) suggest it reads from `conversion_times.json` if available, or calculates from date differences.
- The `_conversionTimes` data is loaded from `data/conversion_times.json`.

**Analysis:** The calculation IS legitimate — it measures the average number of days between quotation submission date and PO issuance date, grouped by month.

**Planned Action:**
1. Add an info icon (ℹ️) tooltip on the chart title explaining:
   - "Average days from Quotation Date to PO Date, grouped by month of PO issuance"
2. Ensure chart shows last 12 months with year-labeled x-axis.
3. Add KPI_INFO entry for this metric.

**Complexity:** Low  
**Files Changed:** `scripts.js`

---

### SM-Q15: Approved Materials — Data Source Unknown

**Reviewer Comment:** Where does Material, Spec number, and Lead Time come from? Likely hardcoded/fake data. Need to clarify if Microtrack has these fields.

**Current Behavior:**  
- SM Tab: Uses semi-hardcoded fallback data at `scripts.js` lines 726–766 with materials like "Steel Rebar", "Electrical Cables", spec numbers like "MVL-STD-001", and "14 days" lead times.
- When real data enriches it (lines 614–626), creates simplistic entries with `material_category || 'Various'`.
- **Reviewer confirms: This list doesn't exist yet — they're still creating it.**

**Planned Action:**
1. Replace the Approved Materials table with a **"Coming Soon"** placeholder:
   - Keep the table card/container with the title.
   - Show a message: "Approved Materials List — Under Preparation. This section will display the approved materials, specifications, and lead times once the data is finalized."
   - Add a subtle icon (📋 or 🔄).
2. Remove all hardcoded/fake material data from `scripts.js`.
3. Once the real list is ready, we'll integrate it as a new JSON data file.

**Complexity:** Low  
**Files Changed:** `scripts.js`, `index.html`

---

### SM-Q16: Submit & Order Quantity Chart — Year Aggregation Issue

**Reviewer Comment:** Chart likely summing ALL years per month (all Januaries combined). Needs time period context — either specific date range or Year filter (from-to). Numbers don't make sense for a single year.

**Current Behavior:**  
- `renderTrendChartLine()` at `scripts.js` line 2242 creates a line chart.
- Data aggregation (lines 542–578) uses `.slice(-12)` — takes the last 12 calendar months across all data.
- X-axis labels show month names only (e.g., "Jan", "Feb") WITHOUT the year.
- If data spans 2025–2026, labels like "Jan" are ambiguous — could be 2025 or 2026.

**Root Cause:** Month labels don't include year. The `.slice(-12)` is correct for "last 12 months" but labels are misleading.

**Planned Action:**
1. Include year in x-axis labels: "Jan '25", "Feb '25", … "Jan '26".
2. Add subtitle: "Last 12 Months" to clarify the time window.
3. Consider adding a Year range filter (FROM year / TO year) to let users customize the view.
4. Verify each month's data comes from a single calendar month, not aggregated across years.

**Complexity:** Low  
**Files Changed:** `scripts.js`

---

### SM-Q17: Three Sub-Issues (Labels, Country Data, Rounding)

#### SM-Q17a: Rename "All Categories" → "All Materials"

**Current:** Supplier List tab section has a filter labeled "All Categories".  
**Action:** Change the label text to "All Materials" in `index.html`.  
**Complexity:** Trivial

#### SM-Q17b: Country Data Quality — UAE Duplicates

**Current:**  
- Country field has: "UAE", "uUAE", "uae", "United Arab Emirates", "Dubai" — all referring to the same country.
- `normalizeCountry()` at `scripts.js` line 1699 only covers some variants (Dubai, Abu Dhabi, Sharjah).
- Case sensitivity not handled ("uUAE" won't match "Dubai").

**Action:**
1. Centralize `normalizeCountry()` as a global utility function applied during data load.
2. Expand the mapping to cover ALL known variants:
   ```js
   'uae' → 'United Arab Emirates'
   'uUAE' → 'United Arab Emirates'
   'UAE' → 'United Arab Emirates'
   'Dubai' → 'United Arab Emirates'
   'Dubai, UAE' → 'United Arab Emirates'
   'Abu Dhabi' → 'United Arab Emirates'
   'Abu dhabi' → 'United Arab Emirates'
   'Sharjah' → 'United Arab Emirates'
   ```
3. Apply case-insensitive matching (`.toLowerCase()` before lookup).
4. Apply normalization to ALL country fields across all data sources during initial load.

**Complexity:** Medium  
**Files Changed:** `scripts.js`

#### SM-Q17c: Round Values to 2 Decimal Places

**Current:**  
- `formatCurrencyShort()` rounds B/M to 2 decimals, K to 1 decimal, but values under $1,000 are NOT rounded (e.g., "$707.6242341729068").
- `formatCurrency()` uses `.toFixed(1)` for B/M/K and `.toFixed(0)` for small values.

**Action:**
1. Fix `formatCurrency()` and `formatCurrencyShort()` to always round to 2 decimal places for raw values.
2. Values under $1,000: use `.toFixed(2)` → "$707.62".
3. Audit all places where currency is displayed without formatting functions.

**Complexity:** Low  
**Files Changed:** `scripts.js`

---

### SM-Q18: Two Sub-Issues (Cancelled Typo, Badge Readability)

#### SM-Q18a: "Cancled" Typo and Cancelled Filter Not Working

**Current:**  
- The typo "Cancled" → "Cancelled" is already fixed in the Python pipeline (`build_v7_data.py` line 128).
- If the typo still appears in the UI, it's from source data that bypasses the normalization, or a display/UI label issue.
- Cancelled filter reportedly not showing cancelled items — needs verification.

**Action:**
1. Verify all status values in loaded JSON are normalized to "Cancelled" (correct spelling).
2. Check if the filter comparison is case-sensitive — ensure case-insensitive matching.
3. If "Cancled" still appears in any data path, add normalization at the JS level as a safety net.
4. Test the Cancelled status filter end-to-end.

**Complexity:** Low  
**Files Changed:** `scripts.js` (verification + possible fix)

#### SM-Q18b: Waiting Badge — Yellow Text Hard to Read

**Current:**  
- Waiting status badge uses yellow background with light-colored text.
- Poor contrast/readability.

**Action:**
1. Change Waiting badge font color to **black (#000)** or dark gray (#333).
2. Verify contrast ratio meets WCAG AA (4.5:1 minimum).
3. Check all status badge color combinations for accessibility.

**Complexity:** Trivial  
**Files Changed:** `styles.css`

---

## DOC 2: Global Spend Analysis

### GSA-Q1: Entity List Mismatch — 20 vs 19, Unknown Entity "CENTRICO"

**Reviewer Comment:** GSA shows 20 entities vs SM's 19. Unknown entity "CENTRICO". Filter not working — doesn't change data.

**Current Behavior:**  
- GSA: `gsaData.filters.entities` has **21 items** (including CENTRICO, Unknown, Yamauchi Gumi).
- SM: `smData.entities` has **19 items** — different entity name set.
- Entity names don't match 1:1 across tabs:
  - SM has: MV LLC, MVL Lebanon, DEFENSE, MPG JV, MVL Abu Dhabi, MVL Kuwait, Gov Svcs
  - GSA/M&D have: CENTRICO, MVL ARABIA, MVL ENERGY, MVL FACILITIES, MVL PROJECTS, MVL SOLUTIONS, MVL TRADING, MVL VENTURES, Unknown
- "CENTRICO" appears in PO data but not quotation data — likely a legitimate entity with POs but no quotations.
- GSA filter requires clicking "Apply" button — changing dropdown alone does nothing.

**Planned Action:**
1. **Entity normalization** in `build_v7_data.py`: Create a master entity mapping that unifies SM and GSA entity names.
2. **CENTRICO**: Keep as legitimate entity (appears in real PO data). Flag for reviewer confirmation.
3. **"Unknown"**: Filter out from dropdowns OR display as "Unassigned" — records with blank entity fields.
4. **Filter fix**: Add instant `change` event listeners to GSA dropdowns (see GSA-Q systematic fix below).
5. **Target**: All 3 tabs show the same unified entity list.

**Complexity:** High (data pipeline alignment)  
**Files Changed:** `build_v7_data.py`, all 3 JSON data files, `scripts.js`

---

### GSA-Q2: Supplier List Incomplete + No Type-Ahead

**Reviewer Comment:** Supplier list only shows A/B names, sort alphabetically, add type-ahead. Filter not working.

**Current Behavior:**  
- `populateGSAFilters()` caps suppliers at 200 (`scripts.js` line ~2970).
- 200 suppliers sorted alphabetically = only A/B names visible.
- Plain `<select>` — no type-ahead.
- Requires Apply button to filter.

**Planned Action:**
1. Remove the 200-supplier cap.
2. Apply `SearchableSelect` component (from SM-Q3).
3. Sort alphabetically.
4. Add instant `change` listener.

**Complexity:** Low (after SearchableSelect is built)  
**Files Changed:** `scripts.js`

---

### GSA-Q3: Projects Need Type-Ahead Search

**Reviewer Comment:** Projects seem sorted. Need type-ahead search. Filter not working.

**Current Behavior:**  
- Projects are sorted alphabetically via `[...new Set(...)].sort()`.
- Capped at 100 entries.
- Plain `<select>`.

**Planned Action:**
1. Remove the 100-project cap.
2. Apply `SearchableSelect` component.
3. Add instant `change` listener.

**Complexity:** Low (after SearchableSelect is built)  
**Files Changed:** `scripts.js`

---

### GSA-Q4: Only 14 of 30 Materials Shown

**Reviewer Comment:** Only 14 of 30 materials shown. Show all 30, alphabetical, type-ahead. Filter not working.

**Current Behavior:**  
- GSA Materials dropdown reads from `gsaData.filters.materials`.
- Current data has 14 items — these are a mix of raw material names from PO data (not the consolidated 7, but not the full 30 either).

**Planned Action:**
1. After data pipeline fix (SM-Q5), ensure `gsaData.filters.materials` contains all 30 raw material names.
2. Apply `SearchableSelect` component.
3. Sort alphabetically.
4. Add instant `change` listener.

**Complexity:** Low (after data pipeline fix)  
**Files Changed:** `build_v7_data.py`, `scripts.js`

---

### GSA-Q5: PO Type Filter Not Working

**Reviewer Comment:** Filter not working. Business rule: Base PO = RFPOs ending in "-1", Change Order = ending in "-2" or higher.

**Current Behavior:**  
- PO Type dropdown has: All Types, Base PO, Change Order.
- `applyGSAFilters()` reads `gsaFilterDiscipline.value` (mislabeled as "discipline" internally but labeled "PO Type" in UI).
- The filter IS implemented in `applyGSAFilters()` — it filters by `po.type` field.
- Requires Apply button click.

**Planned Action:**
1. Verify PO Type filter logic against business rule:
   - Base PO: RFPO number ends in "-1"
   - Change Order: RFPO number ends in "-2" or higher
2. Add instant `change` listener.
3. Fix internal variable naming: rename from "discipline" to "poType" for clarity.

**Complexity:** Low  
**Files Changed:** `scripts.js`

---

### GSA-Q6: Year Range Wrong + Date Filters Not Working

**Reviewer Comment:** Year should be 2010–2026, not 2004+. FROM/TO should default to 1 Jan 2010 through today. Auto-update cap to today's date. Block future dates. None of the 3 filters work.

**Current Behavior:**  
- Year dropdown populated from `gsaData.filters.years` — sorted descending, pulled from actual PO dates.
- `gsaData.annualTrend` shows data from 2012–2026 (15 years). There may be stray old data.
- FROM date (`gsaFilterFrom`) and TO date (`gsaFilterTo`) are HTML5 date inputs.
- No `max` attribute set to block future dates.
- Requires Apply button.

**Planned Action:**
1. Filter years to 2010–2026 range in data pipeline (exclude pre-2010 stray data).
2. Set default FROM = "2010-01-01", TO = today's date.
3. Set `max` attribute on TO date input = today's date (block future dates).
4. Set `min` attribute on FROM date input = "2010-01-01".
5. Add instant `change` listeners to all 3 time filters.
6. Validate FROM ≤ TO.

**Complexity:** Low  
**Files Changed:** `scripts.js`, `index.html`

---

### GSA-Q7: Search Not Working

**Reviewer Comment:** Search not working — no feedback on what's being searched. Either make functional with indicators, or remove.

**Current Behavior:**  
- `gsaSearchInput` exists in HTML (line 523).
- Read in `applyGSAFilters()` (line 3831) — searches across `poNumber, poName, project, supplier, material, entity`.
- Only triggers on Apply button click — not instant.
- No visual feedback.

**Planned Action:**
1. Add debounced instant search (like SM's implementation).
2. Add results indicator: "X of Y POs match '[term]'".
3. Keep Apply button as manual trigger too.

**Complexity:** Low  
**Files Changed:** `scripts.js`

---

### GSA-Q8: KPI Mismatch + Rename Labels

**Reviewer Comment:** KPI mismatch with SM tab. Rename "Active Suppliers" → "No. of Suppliers". Entity count 21 vs 19 in filters — investigate. Rename "Active Entities" → "No. of Entities".

**Current Behavior:**  
- GSA KPIs: 3,522 POs, $396.04M, 314 COs, $30.37M, 1,089 Suppliers, 21 Entities.
- SM KPIs: 7,671 Total POs (includes all statuses), $334.3M.
- The mismatch is because SM counts ALL quotation statuses while GSA counts only actual POs.
- Entity count 21 includes CENTRICO and Unknown.

**Analysis:**  
- KPI values are actually correct for their respective data scopes — SM tracks quotations (12,072) and POs (7,671), while GSA tracks actual Purchase Orders (3,522) and their spend.
- The "mismatch" is expected because they measure different things.
- Entity count difference is due to CENTRICO/Unknown being in PO data but not quotation data.

**Planned Action:**
1. Rename in `index.html`:
   - "Active Suppliers" → "No. of Suppliers"
   - "Active Entities" → "No. of Entities"
2. Add KPI_INFO popup explaining: "GSA tracks 3,522 actual Purchase Orders. SM tracks 12,072 quotations including POs, quotations in progress, waiting, and cancelled."
3. Unify entity count after entity normalization (GSA-Q1).

**Complexity:** Low  
**Files Changed:** `index.html`, `scripts.js`

---

### GSA-Q9: Annual Spend Trend Not Responding to Filters + Make Interactive

**Reviewer Comment:** Not responding to filters. Click month bar → should filter PO Details table to that month's orders.

**Current Behavior:**  
- `createGSAAnnualTrendChart()` renders the Annual Spend Trend chart.
- When `applyGSAFilters()` runs, it does call `createGSAAnnualTrendChart()` with filtered data — so it SHOULD respond to filters.
- No click handler on chart bars.

**Planned Action:**
1. Debug why chart doesn't update with filters — verify the filtered data path is correct.
2. Add click handler: Clicking a month/year bar → filter PO Details table to that time period.
3. Highlight the clicked bar.

**Complexity:** Medium  
**Files Changed:** `scripts.js`

---

### GSA-Q10: Supplier Details Card Not Functional

**Reviewer Comment:** Empty — shows "Select a data point". Should work like SM's Supplier Profile, populate on supplier selection from filters/charts.

**Current Behavior:**  
- GSA has `#gsaSupplierCard` in HTML (line 620) with fields: name, category, rating (★★★★★), orders, value, trend.
- Default shows "Select a data point to see supplier details".
- No JS function wires filter/chart selections to populate this card.

**Planned Action:**
1. Create `updateGSASupplierProfile(supplierName)` function.
2. Wire it to:
   - Supplier filter dropdown change.
   - Top Suppliers chart click.
   - Bottom Suppliers chart click.
   - Top Suppliers by Spend table row click.
3. Populate: Name, Category, Rating (stars), Total POs, Total Spend, Spend Trend.
4. Look up supplier in `suppliersData.suppliers` for contact details.

**Complexity:** Medium  
**Files Changed:** `scripts.js`

---

### GSA-Q11: Spend by Entity — Says "Top 5" Shows 8

**Reviewer Comment:** Says Top 5, shows 8 — fix count or label. Switch to pie chart. Not responding to filters. Make interactive.

**Current Behavior:**  
- Title says "Top 5" but data is sliced to top 8 in `createGSAEntityChart()`.
- Chart is a horizontal bar chart.
- HAS click handler (lines 3229–3246) that filters by entity.

**Planned Action:**
1. Fix label: Change to "Top 8" or limit data to 5 (reviewer prefers one or the other).
2. Switch to **pie chart** as reviewer requested.
3. Verify click handler works correctly (may be broken by same Apply-button dependency).
4. Verify chart rebuilds with filtered data.

**Complexity:** Low  
**Files Changed:** `scripts.js`, `index.html`

---

### GSA-Q12: Spend by Projects — Says "Top 5" Shows 8 + Data Quality

**Reviewer Comment:** Says Top 5, shows 8. Not responding to filters. Some project names look odd (e.g., "3 Days Rental Of Scorpio" at ~$250M).

**Current Behavior:**  
- Same "Top 5" label vs 8 items issue as GSA-Q11.
- HAS click handler (lines 3296–3325) for filtering by project.
- "3 Days Rental Of Scorpio" at $250M is a data quality issue — likely aggregated across many POs tagged to this project name.

**Planned Action:**
1. Fix label: "Top 8" or limit to 5.
2. Verify click handler and filter responsiveness.
3. Flag suspicious project names as **data quality issues** for reviewer investigation. Not a code fix — data needs cleanup in Microtrack.
4. Consider adding PO count to each bar label for context.

**Complexity:** Low  
**Files Changed:** `scripts.js`

---

### GSA-Q13: Top 10 Suppliers — Repeating Colors + Make Interactive

**Reviewer Comment:** Bar colors misleading — same colors repeat, implying equality. Use unique colors. Make interactive — click → show details, cross-filter.

**Current Behavior:**  
- Chart uses Chart.js default color palette which cycles/repeats every ~7 colors.
- HAS click handler (lines 3387–3418) — may not work due to filter dependency.

**Planned Action:**
1. Generate a unique color for each of the 10 bars using a divergent color palette (10 distinct colors).
2. Verify click handler cross-filters correctly.
3. On click: Also populate GSA Supplier Details card.

**Complexity:** Low  
**Files Changed:** `scripts.js`

---

### GSA-Q14: Bottom 10 — Wrong Title + Colors + $1 Orders

**Reviewer Comment:** Says "Top Suppliers", rename to "Most Inactive Suppliers". Color issue. Suspicious $1 orders.

**Current Behavior:**  
- HTML title: "Top Suppliers" (line 649) — **copy-paste error**.
- Subtitle: "Bottom 10 Active Suppliers".
- Uses `gsaData.supplierRanking.slice(-10).reverse()` — last 10 suppliers by spend.

**Planned Action:**
1. Rename title: "Top Suppliers" → "Most Inactive Suppliers" in `index.html`.
2. Rename subtitle: "Bottom 10 Active Suppliers" → "Bottom 10 Suppliers by Spend".
3. Apply unique colors (same as GSA-Q13).
4. Add click handler to populate Supplier Details card.
5. Suspicious $1 orders: Flag as **data quality issue** — may need filtering threshold or reviewer investigation.

**Complexity:** Low  
**Files Changed:** `index.html`, `scripts.js`

---

### GSA-Q15: PO Details Table "All Materials" Showing Disciplines

**Reviewer Comment:** "All Materials" label is showing disciplines. Rename to "Disciplines" or "All Disciplines".

**Current Behavior:**  
- PO Details table has a material filter dropdown labeled "All Materials".
- It shows the discipline/material-code categories from PO data (14 items) — not the 30 raw materials.

**Planned Action:**
1. After data pipeline fix (SM-Q5), separate Materials (30) and Disciplines (13).
2. Rename the dropdown that shows disciplines: "All Materials" → "All Disciplines".
3. Add a separate "All Materials" dropdown showing 30 raw materials.
4. OR: Keep one dropdown but ensure it shows the correct data per its label.

**Complexity:** Low (after data pipeline fix)  
**Files Changed:** `index.html`, `scripts.js`

---

### GSA-Q16: Marketplace Workbench Button on GSA Tab

**Reviewer Comment:** Doesn't belong on GSA tab — this is a Supplier Marketplace component. Remove or replace.

**Current Behavior:**  
- `index.html` line 673: `<button onclick="toggleGSATableView('workbench')">Marketplace Workbench <span id="gsaWorkbenchCount">0</span></button>`
- `toggleGSATableView('workbench')` at `scripts.js` line 3804 just toggles CSS class and calls `updateGSATable()` — both views show the same PO data anyway.

**Planned Action:**
1. Remove the "Marketplace Workbench" button from GSA tab HTML.
2. Remove `toggleGSATableView()` function or repurpose for GSA-specific views.
3. If a toggle is needed, replace with meaningful GSA views (e.g., "Base POs" / "Change Orders").

**Complexity:** Low  
**Files Changed:** `index.html`, `scripts.js`

---

## DOC 3: Materials & Disciplines

### MD-Q1: "All Materials" Dropdown Showing 7 Disciplines Instead of 30 Materials

**Reviewer Comment:** Wrong data source — showing 7 discipline categories instead of 30 materials.

**Current Behavior:**  
- `initMdFilters()` at `scripts.js` line 3949: Material filter reads from `mdData.filters.disciplines` — **SAME source as Discipline filter**.
- `md_data.json` `filters.disciplines` has exactly 7 items.

**Root Cause:** Material dropdown is hardcoded to read from `filters.disciplines` instead of a separate `filters.materials` array.

**Planned Action:**
1. After data pipeline fix (SM-Q5), `md_data.json` will have `filters.materials` (30 items).
2. Change JS: `filterMdMaterial` reads from `filters.materials` instead of `filters.disciplines`.

**Complexity:** Low (after data pipeline fix)  
**Files Changed:** `scripts.js`

---

### MD-Q2: Disciplines Filter Showing Same 7 Items as Materials

**Reviewer Comment:** Disciplines filter identical to Materials filter. Should read from Material Code field (13 distinct values).

**Current Behavior:**  
- Both `filterMdMaterial` and `filterMdDiscipline` read from `mdData.filters.disciplines` — 7 items.
- DISCIPLINE_MAP consolidation reduced 13→7.

**Planned Action:**
1. After data pipeline fix: `filters.disciplines` will have 13 items (pre-consolidation Material Code values).
2. `filterMdDiscipline` reads from `filters.disciplines` (13 items).
3. `filterMdMaterial` reads from `filters.materials` (30 items).
4. Both will be distinct.

**Complexity:** Low (after data pipeline fix)  
**Files Changed:** `scripts.js`

---

### MD-Q3: Entity List Mismatch — 20 vs 19 Across Tabs + CENTRICO + Unknown

**Reviewer Comment:** M&D shows 20 entities vs SM's 19. What is CENTRICO? What is Unknown?

**Identical to GSA-Q1.** Same root cause, same planned action. See GSA-Q1.

---

### MD-Q4: Supplier Filter Not Updating Supplier Profile

**Reviewer Comment:** Selecting a supplier from the filter doesn't update the Supplier Profile section.

**Current Behavior:**  
- M&D filters DO have `change` listeners calling `applyMdFilters()`.
- `applyMdFilters()` does NOT call `updateMdSupplierProfile()` — the profile is only updated when clicking a supplier name in the Supplier Overview table.

**Planned Action:**
1. In `applyMdFilters()`, after filtering data, check if a specific supplier is selected in `filterMdSupplier`.
2. If yes: Find that supplier in `suppliersData.suppliers` → call `updateMdSupplierProfile(supplier)`.
3. If "All Suppliers": Show default/empty profile.

**Complexity:** Low  
**Files Changed:** `scripts.js`

---

### MD-Q5: Add Clear Button for M&D

**Identical to SM-Q1.** Same approach — add Clear button + `clearMdFilters()` function.

---

### MD-Q6: Search Not Working on M&D Tab

**Reviewer Comment:** Search button not working, no filtering or results.

**Current Behavior:**  
- `mdSearchInput` exists in HTML (line 854).
- **NOT wired up** — no event listener in `initMdFilters()`.
- Completely non-functional.

**Planned Action:**
1. Add `input` event listener to `mdSearchInput` with debounce.
2. In `applyMdFilters()`, read search value and filter POs/quotations by matching against: PO number, material, discipline, supplier, project.
3. Add results indicator.

**Complexity:** Low  
**Files Changed:** `scripts.js`

---

### MD-Q7: KPI Ribbon Reading Data Incorrectly

**Reviewer Comment:** Materials should be 30, Disciplines should be 13. Total Material Spend should match SM/GSA. What is "% utilized"? Supplier count seems low.

**Current Behavior:**  
- Materials = 7, Disciplines = 7 (both read `summary.disciplineCount`).
- Total Material Spend = Total Discipline Spend = $396.04M (both read `summary.totalOrdered`).
- "% utilized" = `(totalOrdered / totalQuoted) × 100` = 13.2%.
- Active Projects = 21 but actually counts entities, not projects (bug at line 4083).
- Supplier count = 1,089.

**Planned Action:**
1. Materials KPI: Read from `filters.materials.length` = 30.
2. Disciplines KPI: Read from `filters.disciplines.length` = 13.
3. Total Material Spend vs Total Discipline Spend: These should be different values. Material Spend = sum of POs grouped by material. Discipline Spend = sum grouped by discipline. Currently both show total — need separate aggregations.
4. "% utilized" → Rename to **"Conversion Rate"** and add info icon: "Percentage of quoted value that was converted to purchase orders."
5. **Fix "Active Projects" bug**: Change line 4083 to count distinct **projects** (not entities).
6. Verify supplier count against full `suppliersData.suppliers` dataset.

**Complexity:** Medium  
**Files Changed:** `scripts.js`, `build_v7_data.py`

---

### MD-Q8: Discipline Spend Chart — Rename "Actual" + Show 13 Disciplines

**Reviewer Comment:** Replace "Actual" with "Ordered". Show 13 disciplines, not 7.

**Current Behavior:**  
- Chart legend: "Quoted" and "Actual".
- "Actual" maps to `orderedValue` (PO amounts) at line 4398.
- Only 7 disciplines from `mdData.disciplines` array.

**Planned Action:**
1. Change dataset label: `"Actual"` → `"Ordered"` in `createDisciplineSpendChart()`.
2. After data pipeline fix: `mdData.disciplines` will have 13 entries → chart auto-shows 13.
3. Adjust chart height if needed for 13 bars.

**Complexity:** Low (label change) + Medium (data dependency)  
**Files Changed:** `scripts.js`, `build_v7_data.py`

---

### MD-Q9: Material Distribution — Show 30 Materials + Make Interactive

**Reviewer Comment:** Only 5 materials shown (should be 30). Pie chart should be interactive for cross-filtering.

**Current Behavior:**  
- Doughnut chart shows 5–7 consolidated discipline categories.
- No click handler.

**Planned Action:**
1. After data pipeline fix: Feed 30 raw material categories into the chart.
2. Use doughnut chart with scrollable legend (30 items won't all fit visually).
3. Add click handler: Clicking a segment → set Material filter → `applyMdFilters()`.
4. Consider "Top 15 + Other" grouping if 30 segments are too cluttered.

**Complexity:** Medium  
**Files Changed:** `scripts.js`

---

### MD-Q10: Supplier Profile — [object Object] Bug + Star Rating

**Reviewer Comment:** Supplier Profile not working. Location shows "[object Object]". Rating should use stars.

**Current Behavior:**  
- `updateMdSupplierProfile()` at line 3913: `locationEl.textContent = supplier.country || supplier.location || '-'`
- Default path (line 3900): Uses `suppliersData.suppliers[0]` which has `location: {latitude, longitude}` — an **object**, NOT a string.
- This causes `[object Object]` when rendered as text.
- Same issue for `contact`: `supplier.contact` is an object `{primary_contact, email, phone}`.

**Root Cause:** Code accesses the raw object instead of drilling into its string properties.

**Planned Action:**
1. Fix Location: `supplier.address?.country_standardized || supplier.address?.country || '-'`
2. Fix Contact: `supplier.contact?.primary_contact || '-'`
3. Fix Email: `supplier.contact?.email || '-'`
4. Rating: Already displays stars (⭐ emoji) — keep, but ensure it matches SM tab's ★/☆ style for consistency. Use filled/empty star pattern: `★★★★☆` for 4/5.

**Complexity:** Low  
**Files Changed:** `scripts.js`

---

### MD-Q11: Supplier Overview — Show All Suppliers, Filter Responsive

**Reviewer Comment:** Display all suppliers, filter when using top filter bar.

**Current Behavior:**  
- Initial load: Shows first 10 suppliers from `suppliersData.suppliers` — `slice(0, 10)`.
- Filtered: Shows top 10 by spend — `slice(0, 10)`.
- Always capped at 10.

**Planned Action:**
1. Remove the `slice(0, 10)` cap.
2. Add pagination (20 per page) to handle 1,000+ suppliers.
3. Ensure table rebuilds when any filter changes.
4. Add column sorting (click header to sort by Name, Location, Rating, etc.).

**Complexity:** Medium  
**Files Changed:** `scripts.js`

---

### MD-Q12: Approved Materials — Fake/Unknown Data Source

**Reviewer Comment:** Where is this data from? We don't have this list yet.

**Identical to SM-Q15.** Same "Coming Soon" placeholder approach.

**Current Behavior (M&D specific):**  
- `updateMdApprovedMaterials()` at line 4353 extracts unique `(material, discipline)` pairs from `mdData.quotations`, up to 15 rows.
- Spec numbers (1192, 5410, 4814, etc.) come from actual data fields — but may be PO reference numbers repurposed, not real specification numbers.
- This is data-driven (not hardcoded like SM), but the data it reads from doesn't actually contain approved material specifications.

**Planned Action:**  
Same as SM-Q15 — replace with "Coming Soon" placeholder.

**Complexity:** Low  
**Files Changed:** `scripts.js`

---

### MD-Q13: PO/Material Details Not Updating with Filters

**Reviewer Comment:** PO Material Details table stays the same regardless of filter selections.

**Current Behavior:**  
- `updateMdPoTable()` IS called in `applyMdFilters()` with `mdState.filteredPOs` at line 4052.
- The table SHOULD update, but may not be working correctly.

**Planned Action:**
1. Debug `applyMdFilters()` → `updateMdPoTable()` data flow.
2. Verify `mdState.filteredPOs` actually contains filtered results (not the full dataset).
3. Check if the issue is in filter application logic or table render logic.
4. Add console logging to trace filter → table update pipeline.
5. Ensure pagination resets to page 1 when filters change.

**Complexity:** Medium (debugging)  
**Files Changed:** `scripts.js`

---

## Cross-Tab Systemic Issues

These issues appear across multiple questions and require a unified approach:

### Issue 1: Materials vs Disciplines Data Separation
**Affects:** SM-Q5, SM-Q11, GSA-Q4, GSA-Q15, MD-Q1, MD-Q2, MD-Q7, MD-Q8, MD-Q9  
**Fix:** Single data pipeline change in `build_v7_data.py` to preserve 30 raw materials + 13 original disciplines

### Issue 2: All Filters Need Instant Filtering
**Affects:** GSA-Q1 through Q7, MD-Q6  
**Fix:** Add `change` event listeners to all GSA dropdowns; wire M&D search input

### Issue 3: SearchableSelect Component Needed
**Affects:** SM-Q3, SM-Q4, SM-Q5, GSA-Q2, GSA-Q3, GSA-Q4  
**Fix:** Build ONE reusable component, apply to all dropdowns with 10+ options

### Issue 4: Cross-Filtering Interactivity
**Affects:** SM-Q7, SM-Q10, SM-Q11, SM-Q13, GSA-Q9, GSA-Q11, GSA-Q12, GSA-Q13, GSA-Q14, MD-Q9  
**Fix:** Add Chart.js `onClick` handlers to all charts; clicking filters entire dashboard

### Issue 5: Supplier Profile Across All Tabs
**Affects:** SM-Q9, GSA-Q10, MD-Q4, MD-Q10  
**Fix:** Define missing functions; fix [object Object] bug; wire to filter and chart clicks

### Issue 6: Entity Normalization
**Affects:** GSA-Q1, GSA-Q8, MD-Q3  
**Fix:** Unified entity master list in data pipeline

### Issue 7: Clear Buttons
**Affects:** SM-Q1, MD-Q5  
**Fix:** Add to SM and M&D tabs (GSA already has one)

### Issue 8: Approved Materials — Coming Soon
**Affects:** SM-Q15, MD-Q12  
**Fix:** Replace with placeholder on both tabs

---

## Implementation Priority Matrix

| Priority | Category | Questions | Impact | Effort |
|----------|----------|-----------|--------|--------|
| **P0** | Data Pipeline — Materials/Disciplines separation | SM-Q5, MD-Q1, Q2, Q7, Q8, Q9 | Critical | High |
| **P0** | Fix [object Object] bug | MD-Q10 | Critical (visible bug) | Low |
| **P0** | Fix undefined `updateSupplierProfile()` | SM-Q9 | Critical (silent failure) | Low |
| **P1** | GSA instant filtering | GSA-Q1–Q7 | High | Medium |
| **P1** | SearchableSelect component | SM-Q3,Q4; GSA-Q2,Q3,Q4 | High | Medium |
| **P1** | Cross-filtering interactivity | SM-Q7,Q10,Q11,Q13; GSA-Q9–Q14; MD-Q9 | High | High |
| **P1** | Clear buttons (SM + M&D) | SM-Q1, MD-Q5 | Medium | Low |
| **P1** | Entity normalization | GSA-Q1, Q8; MD-Q3 | High | Medium |
| **P2** | Country normalization | SM-Q17b | Medium | Low |
| **P2** | Alphabetical sorting all dropdowns | SM-Q2,Q3,Q4 | Medium | Low |
| **P2** | Chart labels/colors/titles | GSA-Q11,Q13,Q14; MD-Q8 | Medium | Low |
| **P2** | Rename KPI labels | GSA-Q8 | Low | Trivial |
| **P2** | Search feedback indicators | SM-Q6, GSA-Q7, MD-Q6 | Medium | Low |
| **P2** | Currency rounding | SM-Q17c | Low | Low |
| **P2** | Badge readability | SM-Q18b | Low | Trivial |
| **P3** | Supplier Overview pagination | MD-Q11 | Medium | Medium |
| **P3** | Map improvements | SM-Q8 | Medium | Medium |
| **P3** | Submit & Order chart year labels | SM-Q16 | Low | Low |
| **P3** | Employee list improvements | SM-Q12 | Low | Low |
| **P3** | Quotation-to-PO info tooltip | SM-Q14 | Low | Trivial |
| **P3** | Remove Workbench from GSA | GSA-Q16 | Low | Trivial |
| **P3** | Date filter defaults/limits | GSA-Q6 | Low | Low |
| **P3** | Approved Materials "Coming Soon" | SM-Q15, MD-Q12 | Low | Low |
| **P3** | M&D Active Projects bug | MD-Q7 | Low | Low |
| **DATA** | CENTRICO entity — verify | GSA-Q1, MD-Q3 | — | Reviewer action |
| **DATA** | "Unknown" entity records | GSA-Q1, MD-Q3 | — | Reviewer action |
| **DATA** | Missing supplier/employee names | SM-Q12, Q13 | — | Microtrack cleanup |
| **DATA** | Suspicious projects ($250M rental) | GSA-Q12 | — | Reviewer action |
| **DATA** | $1 orders | GSA-Q14 | — | Reviewer action |

---

## Estimated Total Changes

| File | Change Count | Scope |
|------|-------------|-------|
| `build_v7_data.py` | ~5 changes | Materials/Disciplines separation, entity normalization, year filtering |
| `scripts.js` | ~35 changes | Filters, SearchableSelect, cross-filtering, Supplier Profile, KPIs, labels |
| `index.html` | ~12 changes | Clear buttons, label renames, remove Workbench, dropdown additions |
| `styles.css` | ~5 changes | SearchableSelect styling, badge colors, hover effects |
| Data JSON files | Regenerated | All 3 tab JSON files rebuilt after pipeline changes |

---

*This document will be updated as implementation proceeds. Each question will be marked ✅ upon completion.*
