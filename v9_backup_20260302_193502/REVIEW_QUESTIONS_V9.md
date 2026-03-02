# V9 Review Questions — March 2, 2026

Two stakeholder questions regarding data discrepancies between the **Supplier Marketplace (SM)** tab and the **Global Spend Analysis (GSA)** tab.

---

## Q1: Purchase Order Count Discrepancy

**Question:** Slight difference between Purchase Order number in the Supplier Marketplace and Global Spend Analysis page.

### Image Description

| Element        | SM Tab (Left)                    | GSA Tab (Right)                         |
| -------------- | -------------------------------- | --------------------------------------- |
| **Card Style** | Gray/white card, no border color | Orange top-border card with 📦 box icon |
| **Label**      | "Total Purchase Orders"          | "TOTAL NO. OF PURCHASE ORDERS"          |
| **Value**      | **3,613**                        | **3,620**                               |
| **Subtitle**   | "(incl. change orders)"          | "Including Change Orders"               |
| **Info Icon**  | Blue ℹ️ (top-right)              | Orange/red ℹ️ (top-right)               |

### Discrepancy Details

| Metric   | SM Tab | GSA Tab | Difference |
| -------- | ------ | ------- | ---------- |
| PO Count | 3,613  | 3,620   | **7 POs**  |

### Stakeholder Comment

> "Seems there are few orders not being read in the Marketplace but are ready in Global Spend Analysis. These values should match."

### Analysis Needed

- SM "PO Count" KPI is computed from quotation records that have linked POs (win rate logic)
- GSA "Total POs" KPI is computed from `gsa_data.json` (actual PO records)
- The 7 PO difference needs investigation — likely SM counts unique PO links from quotations while GSA counts actual PO records
- **Stakeholder expectation: Both tabs must show the same PO count and values**

---

## Q2: PO Values Discrepancy

**Question:** PO Values — same comment as above — slight difference between Marketplace and Global Spend Analysis.

### Image Description

| Element        | SM Tab (Left)               | GSA Tab (Right)                          |
| -------------- | --------------------------- | ---------------------------------------- |
| **Card Style** | White card, no border color | Green top-border card with 💵 money icon |
| **Label**      | "PO Values"                 | "TOTAL SPEND"                            |
| **Value**      | **$412.6M** (blue text)     | **$414.34M** (dark text)                 |
| **Subtitle**   | _(none)_                    | "Tax: $1.69M"                            |
| **Info Icon**  | Blue ℹ️ (top-right)         | Orange/red ℹ️ (top-right)                |

### Discrepancy Details

| Metric   | SM Tab  | GSA Tab  | Difference  |
| -------- | ------- | -------- | ----------- |
| PO Value | $412.6M | $414.34M | **~$1.74M** |

### Analysis Needed

- SM "PO Values" KPI is derived from quotation-linked PO spend (subset of all POs)
- GSA "Total Spend" KPI is computed from all PO records in `gsa_data.json` ($414.34M)
- GSA includes Tax subtext ($1.69M) — the $1.74M difference is close to but not exactly the tax amount
- Need to investigate whether difference is due to: (a) SM only counting POs linked to quotations, (b) tax inclusion/exclusion, or (c) different FX conversion paths

---

## Q3: Change Order Values Discrepancy

**Question:** Change Order Values — very minor difference between the change order values of the Marketplace and the Global Spend Analysis. I think the value in the Marketplace is rounding up to the nearest number. Ideally both values should match.

### Image Description

| Element        | SM Tab (Left)               | GSA Tab (Right)                                    |
| -------------- | --------------------------- | -------------------------------------------------- |
| **Card Style** | White card, no border color | Gold/yellow top-border card with 💰 money bag icon |
| **Label**      | "CO Value"                  | "TOTAL AMOUNT OF CHANGE ORDERS"                    |
| **Value**      | **$12.0M** (blue text)      | **$11.99M** (dark text)                            |
| **Subtitle**   | _(none)_                    | "2.9% of total spend"                              |
| **Info Icon**  | Blue ℹ️ (top-right)         | Orange/red ℹ️ (top-right)                          |

### Discrepancy Details

| Metric   | SM Tab | GSA Tab | Difference           |
| -------- | ------ | ------- | -------------------- |
| CO Value | $12.0M | $11.99M | **~$10K** (rounding) |

### Stakeholder Comment

> "I think the value in the Marketplace is rounding up to the nearest number. Ideally both values should match."

### Analysis Needed

- SM "CO Value" KPI appears to round $11.99M up to $12.0M
- GSA shows more precise value of $11.99M
- Both tabs should use the same formatting precision (likely `formatCurrencyShort()`)
- Need to verify both tabs source CO value from the same data and apply the same rounding rules
- **Stakeholder expectation: Both tabs must show matching CO values**

---

## Q4: Quote Value — Include Tax in Total Figure

**Question:** In the Marketplace, can we please modify it to include the taxes so we can put the total figure which is "$259.87M Quote Value (including Tax $1.58M)".

### Image Description

| Element        | SM Tab (Current)            |
| -------------- | --------------------------- |
| **Card Style** | White card, no border color |
| **Label**      | "Quote Value"               |
| **Value**      | **$258.3M** (blue text)     |
| **Subtitle**   | "Tax: $1.58M" (gray text)   |
| **Info Icon**  | Blue ℹ️ (top-right)         |

### Requested Change

| Aspect          | Current                                                  | Requested                                                            |
| --------------- | -------------------------------------------------------- | -------------------------------------------------------------------- |
| **Value**       | $258.3M                                                  | **$259.87M** (quote value + tax combined)                            |
| **Label**       | "Quote Value" / "Tax: $1.58M"                            | **"Quote Value (including Tax $1.58M)"**                             |
| **Calculation** | Shows quote value excluding tax, tax as separate subtext | Show total (value + tax) as main number, note tax inclusion in label |

### Analysis Needed

- Currently: Main value = `totalQuotationValueUSD` ($258.3M), subtext = `totalQuotationTaxUSD` ($1.58M)
- Requested: Main value = `totalQuotationValueUSD + totalQuotationTaxUSD` ($258.3M + $1.58M ≈ $259.87M)
- Label/subtext should indicate tax is included: "including Tax $1.58M"
- **Stakeholder expectation: Show combined total with tax included, clearly labeled**

---

## Q5: KPI Decimal Precision — Standardize to 2 Decimal Places

**Question:** Also in the KPIs on both the Marketplace and Global Spend Analysis, we need to take the numbers with 2 digits decimals. Currently in the Marketplace, we are taking 1 digit after the decimal, and in the Global Spend Analysis, we are taking 2.

### Image Description — SM Tab (Top Row, All 7 KPIs)

| KPI                   | Value       | Decimals         | Circled                      |
| --------------------- | ----------- | ---------------- | ---------------------------- |
| Request for Quotation | 3,941       | N/A (integer)    | No                           |
| Quote Value           | **$258.3M** | **1 decimal** ❌ | **Yes** (red circle + arrow) |
| Total Purchase Orders | 3,613       | N/A (integer)    | No                           |
| PO Values             | **$412.6M** | **1 decimal** ❌ | **Yes** (red circle + arrow) |
| Win Rate              | 91.7%       | 1 decimal        | No                           |
| Change Orders         | 297         | N/A (integer)    | No                           |
| CO Value              | **$12.0M**  | **1 decimal** ❌ | No                           |

### Image Description — GSA Tab (All 6 KPIs)

| KPI                           | Value            | Decimals          | Circled                                        |
| ----------------------------- | ---------------- | ----------------- | ---------------------------------------------- |
| Total No. of Purchase Orders  | 3,620            | N/A (integer)     | No                                             |
| Total Spend                   | **$414.34M**     | **2 decimals** ✅ | **Yes** (red circle + X mark — correct format) |
| Total No. of Change Orders    | 297 / 193 groups | N/A (integer)     | No                                             |
| Total Amount of Change Orders | **$11.99M**      | **2 decimals** ✅ | **Yes** (red circle + arrow — correct format)  |
| No. of Suppliers              | 2,189            | N/A (integer)     | No                                             |
| No. of Entities               | 18               | N/A (integer)     | No                                             |

### Discrepancy Details

| Tab                | Current Decimals                     | Required Decimals                            |
| ------------------ | ------------------------------------ | -------------------------------------------- |
| SM (Marketplace)   | 1 decimal ($258.3M, $412.6M, $12.0M) | **2 decimals** ($258.29M, $412.60M, $12.00M) |
| GSA (Global Spend) | 2 decimals ($414.34M, $11.99M)       | **2 decimals** ✅ already correct            |

### Requested Change

- **SM tab:** Change `formatCurrencyShort()` usage for KPI values from 1 decimal to 2 decimal places
- **GSA tab:** Already uses 2 decimals — no change needed
- **Stakeholder expectation: All currency KPIs across both tabs must show 2 decimal places**

---

## Q6: Status — Missing 5th Status ("Quotation Closed")

**Question:** On the status there are 4 statuses, but on Microtrack there are 5. Vijay is running a new script because apparently it did not extract the fifth status.

### Image Description — Status Breakdown Chart (SM Tab)

| Status    | Color         | Bar Length          | Count     |
| --------- | ------------- | ------------------- | --------- |
| Order     | Green         | Long bar (dominant) | **3,720** |
| Quotation | Blue          | Short bar           | **97**    |
| Waiting   | Yellow/Orange | Short bar           | **72**    |
| Cancelled | Red           | Short bar           | **52**    |

Below the chart:

- **91.7%** Conversion Rate
- **97** Open Quotes

### Image Description — Microtrack Source System (Dropdown)

Microtrack status dropdown shows **5 statuses**:

1. All
2. Order Placed
3. Quotation Issued
4. Waiting Approval
5. Quotation Canceled
6. **Quotation Closed** ← (highlighted with red arrow — this is the **missing 5th status**)

### Status Mapping (Dashboard vs Microtrack)

| Dashboard Status | Microtrack Status    | Present in Dashboard?     |
| ---------------- | -------------------- | ------------------------- |
| Order            | Order Placed         | ✅ Yes                    |
| Quotation        | Quotation Issued     | ✅ Yes                    |
| Waiting          | Waiting Approval     | ✅ Yes                    |
| Cancelled        | Quotation Canceled   | ✅ Yes                    |
| _(missing)_      | **Quotation Closed** | ❌ **No — not extracted** |

### Analysis Needed

- The data extraction script did not include "Quotation Closed" status records
- Vijay is running a new extraction script to include the 5th status
- Once new data is available, pipeline needs to be re-run to include "Quotation Closed" records
- Status chart and filter dropdown need to accommodate the 5th status
- **Stakeholder expectation: All 5 Microtrack statuses should be present in the dashboard**
- **Dependency: Waiting for new data extract from Vijay**

---

## Q7: Filters — PO Values and CO Count Not Updating When Filtered

**Question:** If I filter by Project, most of the values change, except the PO values in the KPIs and no. of COs. For instance below I filtered by the entity Macro (DMCC), the values in red did not change.

### Image Description — SM Tab Filtered by Entity "MACRO"

**Filter Bar (top):**
| Filter | Selected Value |
|--------|---------------|
| Entity | **MACRO** |
| Project | All Projects |
| Supplier | All Suppliers |
| Status | All Statuses |
| Material | All Materials |
| Material Code | All Material Codes |
| From / To | Empty |

**KPIs Row (filtered by MACRO):**

| KPI                   | Value        | Updates on Filter?                     | Circled?             |
| --------------------- | ------------ | -------------------------------------- | -------------------- |
| Request for Quotation | 1,973        | ✅ Yes (changed from 3,941)            | No                   |
| Quote Value           | $164.59M     | ✅ Yes (changed from $258.3M)          | No                   |
| Total Purchase Orders | **3,613**    | ❌ **No — did NOT change**             | **Yes** (red circle) |
| PO Values             | **$412.65M** | ❌ **No — did NOT change**             | **Yes** (red circle) |
| Win Rate              | 183.1%       | ✅ Yes (but value seems wrong — >100%) | **Yes** (red circle) |
| Change Orders         | **297**      | ❌ **No — did NOT change**             | **Yes** (red circle) |
| CO Value              | **$11.99M**  | ❌ **No — did NOT change**             | **Yes** (red circle) |

### Discrepancy Details

| KPI           | Unfiltered | Filtered (MACRO) | Changed?         |
| ------------- | ---------- | ---------------- | ---------------- |
| RFQ Count     | 3,941      | 1,973            | ✅               |
| Quote Value   | $258.3M    | $164.59M         | ✅               |
| Total POs     | 3,613      | **3,613**        | ❌ Bug           |
| PO Values     | $412.6M    | **$412.65M**     | ❌ Bug           |
| Win Rate      | 91.7%      | **183.1%**       | ⚠️ Wrong (>100%) |
| Change Orders | 297        | **297**          | ❌ Bug           |
| CO Value      | $12.0M     | **$11.99M**      | ❌ Bug           |

### Analysis Needed

- SM KPIs for PO Count, PO Values, Change Orders, and CO Value are NOT responding to filter changes
- These KPIs likely use `summary` object (precomputed totals) instead of filtering from `quotationsData`
- Win Rate >100% when filtered suggests PO count (numerator) is unfiltered while RFQ count (denominator) is filtered
- `applyFilters()` function needs to recompute PO-related KPIs based on filtered data, not summary totals
- **Stakeholder expectation: ALL KPIs must update when any filter is applied**

---

## Q8: Material Distribution — Rename, Pie Only, and Material/Discipline Mapping

**Question (Part 1):** Can we please remove all the displays except the Pie? I think this is the only representation that makes sense.

**Question (Part 2):** Also, this is not Material Distribution, this is essentially "Discipline Distribution". I think there is some confusion between Material and Discipline. We have 13 Disciplines whereas we have 30 Materials. I will resend you the mapping list.

**Question (Part 3):** How can you tell the Discipline (called on the system "Material Code")? Through the letters in the RFQ or RFPO number. How can we know the Material itself? Through the code range — the last part of the RFQ or RFPO number. For instance if the number of RFPO ends with "-A5356", it means the Discipline (Material Code) is "Architectural" and the Material is "Sanitary and Toilet Accessories".

### Image Description — Material Distribution Chart (SM Tab)

| Element                 | Details                                                                                                                                                                                                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Title**               | "Material Distribution" with chart icon                                                                                                                                                                                                                          |
| **Chart Type Buttons**  | Bar, **Pie** (selected/active), Line, Radar                                                                                                                                                                                                                      |
| **Chart Type**          | Pie chart showing all material codes                                                                                                                                                                                                                             |
| **Legend (11 visible)** | Services (dominant, dark blue), Various (light blue), Electrical (green), Mechanical (light green), Architectural (orange), Fire (dark orange), Chemicals (purple), Office Assets (pink), Rental (dark gray), Tools (cyan), Logistics (red), Protection (purple) |

### Requested Changes

1. **Remove chart type toggle** — keep only Pie chart (remove Bar, Line, Radar buttons)
2. **Rename title** from "Material Distribution" to **"Discipline Distribution"**
3. **Add "Consumables"** as 13th discipline (currently showing 12, Microtrack has 13)

### Discipline (Material Code) Reference — From Microtrack

The discipline letter code is embedded in the RFQ/RFPO number.

| Material Code (Discipline) | Letter Code |
| -------------------------- | ----------- |
| Architectural              | A           |
| Chemicals                  | C           |
| Electrical                 | E           |
| Fire                       | F           |
| Logistics                  | L           |
| Mechanical                 | M           |
| Protection                 | P           |
| Rental                     | R           |
| Services                   | S           |
| Tools                      | T           |
| Various                    | V           |
| **Consumables**            | **C**       |
| Office Assets              | O           |

> **Note:** Chemicals and Consumables share letter code "C" — need clarification on disambiguation.

### Material Name → Discipline → Code Range Mapping

The code range is the last numeric part of the RFQ/RFPO number (e.g., "-A5356" → Discipline: Architectural, Material: Sanitary and Toilet Accessories).

| Material Name                               | Discipline (Material Code) | Code Range    |
| ------------------------------------------- | -------------------------- | ------------- |
| Polyurethane Foam                           | Chemicals                  | 6000 - 6050   |
| Firestop / DC 315                           | Fire                       | 7000 - 7999   |
| Sandwich Panel                              | Architectural              | 5000 - 5100   |
| Accessories / Connection for Sandwich Panel | Architectural              | 5101 - 5150   |
| Steel Coil                                  | Architectural              | 5151 - 5200   |
| Containers                                  | Various                    | 4200 - 4250   |
| Doors                                       | Architectural              | 5201 - 5250   |
| Windows                                     | Architectural              | 5251 - 5300   |
| Transportation                              | Logistics                  | 4000 - 4999   |
| Discount                                    | Logistics                  | 0 - 0         |
| Machine / Equipments                        | Mechanical                 | 4000 - 4100   |
| Electrical                                  | Electrical                 | 6800 - 6999   |
| Design                                      | Services                   | 9000 - 9030   |
| Fit Out Project                             | Architectural              | 0 - 0         |
| Building Materials                          | Various                    | 40000 - 50000 |
| Mechanical Items                            | Mechanical                 | 4101 - 4200   |
| Paints                                      | Architectural              | 5301 - 5350   |
| Rental                                      | Rental                     | 1500 - 1600   |
| Chemicals                                   | Chemicals                  | 6051 - 6100   |
| Graco Spares                                | Various                    | 4301 - 4350   |
| Sanitary and Toilet Accessories             | Architectural              | 5351 - 5400   |
| Construction                                | Services                   | 9031 - 9050   |
| Misc.                                       | Various                    | 4351 - 4500   |
| Tools                                       | Tools                      | 1000 - 1100   |
| PPE                                         | Protection                 | 4800 - 4900   |
| LSA - Life Support Area                     | Services                   | 9051 - 9070   |
| Subcontract                                 | Services                   | 9071 - 9090   |
| Computer Peripherals                        | Office Assets              | 1 - 100       |
| MHE                                         | Logistics                  | 7000 - 7999   |
| Services                                    | Services                   | 9100 - 9200   |

### Parsing Logic

Format: `RFPO-YYYY-XXXXXXX-<LetterCode><CodeRange>`

Example: `RFPO-2024-1234567-A5356`

- **Letter Code:** `A` → Discipline = **Architectural**
- **Code Number:** `5356` → falls in range 5351-5400 → Material = **Sanitary and Toilet Accessories**

### Analysis Needed

- Remove Bar/Line/Radar chart toggle — show Pie only
- Rename chart title from "Material Distribution" to "Discipline Distribution"
- Verify current dashboard has all 13 disciplines (currently shows 12 — missing "Consumables")
- Validate that material code and material name mappings in pipeline match the provided reference table
- **Stakeholder expectation: Pie chart only, renamed to "Discipline Distribution", with correct mapping**

---

## Q9: Supplier List Not Filtering by Project

**Question:** Supplier List is not changing when I filter by Project. It should tell me only which suppliers were used on the project I filtered.

### Image Description — Supplier List Table (SM Tab, Bottom Section)

| Element           | Details                                                                               |
| ----------------- | ------------------------------------------------------------------------------------- |
| **Active Tab**    | "Supplier List (2189)" (selected, blue underline) — second tab is "Quotation Details" |
| **Filter Bar**    | Search field, "All Materials" dropdown, "All Countries" dropdown, Clear button        |
| **Show**          | 50 per page                                                                           |
| **Table Columns** | SUPPLIER NAME, CONTACT, EMAIL, PHONE, COUNTRY, CATEGORY                               |

**Sample rows visible:**

| Supplier Name                                | Contact                                   | Country              | Category             |
| -------------------------------------------- | ----------------------------------------- | -------------------- | -------------------- |
| (ATC) Asr Taqa Contracting                   | Iftikhar Raza                             | -                    | Subcontract          |
| (GLV) Gulf Link Venture Cont. Co. W.L.L.     | K.Arjun – Business Development Officer... | Kuwait               | Subcontract          |
| (NAVC) Project                               | Wali Satesh                               | Afghanistan          | Construction         |
| (SACC) Sabari Al Khayrat Contracting Company | frazem, kraidan                           | Turkey               | Subcontract          |
| (SJC) SAN JUAN CONSTRUCTION INC.             | Lucy Polman                               | United States        | Subcontract          |
| 1000 Business Cards Both Sides Multicolor... | Touqir Pasha                              | United Arab Emirates | Discount             |
| 3rd Party Engineering LLC                    | Abdulkader Kairouz                        | Lebanon              | Subcontract          |
| Ai Apps Solutions FZC                        | Mr. Anoop                                 | United Arab Emirates | Computer Peripherals |
| A F Husain L.L.C                             | Kiran Chandran                            | United Arab Emirates | Tools                |
| A ONE TOOLS TRADING LLC                      | MUSTAFA                                   | United Arab Emirates | Tools                |

### Bug Description

- Supplier List always shows all 2,189 suppliers regardless of selected filters
- When a project/entity/material filter is applied, the supplier table should filter to only show suppliers relevant to the filtered data
- Currently the table uses the full `suppliers.json` master list instead of cross-referencing with filtered quotation/PO data
- **Stakeholder expectation: Supplier List must filter to show only suppliers used in the selected project/entity/filter context**

---

## Q10: Map — Not Showing All Countries & Not Updating on Supplier Filter

**Question (Part 1):** I still don't think the map is catching all the countries. For example, when I filter by project BIOT (which is in DG), the map shows for me circles in USA in red, that means the global map (when I apply no filter) is not reflecting all the countries of my suppliers.

**Question (Part 2):** Moreover, I noticed when I filter by supplier, although the location is present on the Supplier Profile tab, but the map is not updated.

### Image Description — Map (Unfiltered, Full View)

| Element             | Details                                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| **Title**           | "Location of Suppliers" with chart icon                                                        |
| **Map Type**        | Leaflet.js world map with zoom (+/-) controls                                                  |
| **Circles**         | Multiple green circles of varying sizes across Middle East, Asia, Europe, Africa, Americas     |
| **Largest cluster** | Red circle in UAE/Middle East region (highest concentration)                                   |
| **Legend**          | "Supplier Count": 1-10 (green), 11-20 (olive), 21-30 (yellow-green), 31-40 (orange), 40+ (red) |
| **Notable**         | USA shows a single light green/olive circle                                                    |

### Image Description — Map (Filtered by Supplier, Empty)

| Element                            | Details                                              |
| ---------------------------------- | ---------------------------------------------------- |
| **Title**                          | "Location of Suppliers"                              |
| **Map**                            | Completely empty — no circles shown, zoomed out view |
| **Supplier Profile** (right panel) | Shows "Oman Cables Industry (SAOG)", location: Oman  |
| **Contact**                        | Ali Osman Korkut                                     |
| **Email**                          | alikorikut@oryoman.com                               |
| **Phone**                          | +971 84 494 5484                                     |
| **Rating**                         | Stars shown                                          |
| **Responsible MVL Employee**       | "No employee data for selected filters"              |

### Bug Details

| Issue                                   | Description                                                                                                                                                                                               |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Missing countries on unfiltered map** | Not all supplier countries are being plotted — some suppliers have country data but don't appear on the map                                                                                               |
| **BIOT/DG project filter**              | Filtering by BIOT project shows USA circles in red, suggesting country data is incorrect for some suppliers                                                                                               |
| **Supplier filter → empty map**         | When a specific supplier is selected (e.g., Oman Cables Industry), the map shows NO circles even though the Supplier Profile card shows the country (Oman)                                                |
| **Root cause (likely)**                 | Map uses `countryCoords` lookup — if a supplier's country isn't in the coords table or `normalizeCountry()` mapping, it won't appear. Also, map rendering may not be triggered by supplier filter changes |

### Analysis Needed

- Verify `countryCoords` has entries for all countries present in supplier data
- Check if `normalizeCountry()` handles all country name variants in the data
- Map needs to update when ANY filter is applied (project, supplier, entity, etc.)
- When a supplier is selected, the map should zoom to and highlight that supplier's country
- Cross-reference `client_country_map.json` with suppliers to find unmapped countries
- **Stakeholder expectation: Map must reflect all supplier countries and update on every filter change**

---

## Q11: Multiple Charts/Tables Not Updating When Filtering by Supplier

**Question:** When I filter by supplier, the following is not happening:

- A) Material Distribution is not updating.
- B) Quotation to PO time is not updating.
- C) The Submit & Order Quantity is not updating.
- D) The Quotation Details and Supplier List are not updating.

### Image Description — SM Tab (Filtered by Supplier, Lower Section)

The image shows the SM tab bottom section after a supplier filter has been applied. Multiple components appear unchanged/unresponsive:

| Component                             | Location                | Status          | Details                                                                                               |
| ------------------------------------- | ----------------------- | --------------- | ----------------------------------------------------------------------------------------------------- |
| **Top 10 Suppliers by Spend**         | Left column, top        | ⚠️ Empty        | "No suppliers found for selected filters"                                                             |
| **Material Distribution** (Bar chart) | Center column, top      | ❌ Not updating | Still shows all 12 material codes with "N materials" labels (Services dominant, full unfiltered data) |
| **Approved Material**                 | Right column, top       | N/A             | Shows "Coming Soon" placeholder                                                                       |
| **Quotation to PO Time**              | Center column, middle   | ❌ Not updating | Bar chart still shows all monthly conversion times (unfiltered)                                       |
| **Submit & Order Quantity**           | Full width, bottom      | ❌ Not updating | Line chart with 3 lines (Quotes, Orders, COs) showing full unfiltered monthly trends                  |
| **Supplier List (2189)**              | Bottom table area       | ❌ Not updating | Still shows count of 2,189 (full master list)                                                         |
| **Quotation Details**                 | Bottom table area (tab) | ❌ Not updating | Shows "No quotations match filters" but table headers still visible                                   |

### Bug Details

| Component                      | Expected Behavior                                             | Current Behavior                           |
| ------------------------------ | ------------------------------------------------------------- | ------------------------------------------ |
| **A) Material Distribution**   | Show only materials/disciplines for selected supplier         | Shows all 12 codes unfiltered              |
| **B) Quotation to PO Time**    | Show conversion times for selected supplier's quotations only | Shows all monthly averages unfiltered      |
| **C) Submit & Order Quantity** | Show monthly quote/order trends for selected supplier only    | Shows full unfiltered trend lines          |
| **D) Quotation Details**       | Show only quotations from selected supplier                   | Shows "No quotations match filters" or all |
| **D) Supplier List**           | Filter to selected supplier (or related suppliers)            | Shows all 2,189 suppliers                  |

### Analysis Needed

- `applyFilters()` likely doesn't pass supplier filter to chart rendering functions
- Material Distribution chart (`renderMaterialChartCanvas()`) may not receive filtered data
- Quotation to PO Time chart may use precomputed `conversion_times.json` instead of filtering
- Submit & Order Quantity trend chart may use full dataset instead of filtered subset
- Supplier List and Quotation Details tables need to cross-reference with active filters
- **Stakeholder expectation: ALL charts, tables, and components must update when ANY filter is applied**

---

## Q12: Quotation to PO Time — Not Updating on Any Filter

**Question:** Quotation to PO time is not changing when I apply any filter, for example by supplier.

### Image Description — Quotation to PO Time Chart (SM Tab)

| Element        | Details                                                               |
| -------------- | --------------------------------------------------------------------- |
| **Title**      | "Quotation to PO Time" with timer/clock icon (purple)                 |
| **Chart Type** | Vertical bar chart                                                    |
| **X-Axis**     | Monthly periods (2013-06 through 2025-10)                             |
| **Y-Axis**     | Days (0 to 250)                                                       |
| **Bar Labels** | Each bar shows "Nd" label (e.g., "226d", "122d", "113d", "71d", etc.) |

**Notable data points:**
| Period | Days |
|--------|------|
| 2014-04 | 226d (highest) |
| 2014-06 | 122d |
| 2014-08 | 113d |
| 2014-10 | 71d |
| 2016-01 | 84d |
| 2016-06 | 49d |
| 2016-11 | 133d |
| 2019-02 | 139d |
| 2019-06 | 54d, 42d |
| 2019-12 | 149d |
| 2020-04 | 56d |
| 2020-06 | 204d |
| 2020-08 | 99d |
| 2020-10 | 119d, 94d |
| 2024-01 | 191d |
| 2025-04 | 51d |

### Bug Details

- This chart uses precomputed data from `conversion_times.json` which contains all RFQ→PO links
- The chart does NOT re-filter or recompute when any filter is applied (entity, project, supplier, etc.)
- It always shows the same unfiltered monthly average conversion times
- **Related to Q11-B** — same issue reported as part of supplier filter, but this confirms it applies to ALL filters

### Analysis Needed

- `conversion_times.json` contains 183 linked RFQ→PO conversions with monthly averages
- Chart rendering function needs to accept filtered quotation data and recompute conversion times dynamically
- When a filter is applied, only show conversion times for quotations matching the filter criteria
- **Stakeholder expectation: Quotation to PO Time chart must update when any filter is applied**

---

## Q13: Submit & Order Quantity — Not Updating on Any Filter

**Question:** Submit & Order Quantity is not changing with any filter.

### Image Description — Submit & Order Quantity Chart (SM Tab)

| Element        | Details                                                 |
| -------------- | ------------------------------------------------------- |
| **Title**      | "Submit & Order Quantity" with chart icon               |
| **Chart Type** | Line chart with filled area (area chart), 3 data series |
| **X-Axis**     | Months (Jan through Dec)                                |
| **Y-Axis**     | Quantity (0 to 1,200)                                   |
| **Legend**     | Quotes (blue), Orders (green), COs (yellow/gold)        |

**Data Series:**

| Series     | Color                     | Typical Range | Pattern                                                           |
| ---------- | ------------------------- | ------------- | ----------------------------------------------------------------- |
| **Quotes** | Blue line (top)           | ~800–1,100    | Highest line, peaks around May and Jul (~1,100)                   |
| **Orders** | Green line (middle)       | ~600–900      | Follows quotes pattern, light blue fill between quotes and orders |
| **COs**    | Yellow/Gold line (bottom) | ~20–50        | Nearly flat at bottom, minimal variation                          |

### Bug Details

- This chart shows monthly submission and order quantities aggregated across ALL data
- Does NOT respond to any filter changes (entity, project, supplier, material, etc.)
- Always displays the same full-dataset monthly trends
- **Related to Q11-C** — same issue confirmed, but this states it applies to ALL filters, not just supplier

### Analysis Needed

- Chart rendering function uses full dataset instead of filtered subset
- Needs to recompute monthly quote/order/CO counts based on currently active filters
- When filters are applied, only matching quotation and PO records should be counted per month
- **Stakeholder expectation: Submit & Order Quantity chart must update when any filter is applied**

---

## Global Spend Analysis (GSA) Tab Questions

---

## Q14: Annual Spend Trend — Change Orders Showing as $0 Across All Months

**Question:** Annual Spend Trend — I like how by default it is now taking the last 12 months, but I do not think the change orders are being reflected properly. Across all the year, it is appearing that CO value is 0, which is not true.

### Image Description — Annual Spend Trend Chart (GSA Tab)

| Element          | Details                                                                               |
| ---------------- | ------------------------------------------------------------------------------------- |
| **Title**        | "Annual Spend Trend (Base vs Change Orders)" with chart icon                          |
| **Chart Type**   | Combo chart — stacked bar (Base Spend + Change Orders) + line (Running Total)         |
| **X-Axis**       | Monthly periods (Mar 25 through Feb 26) — last 12 months                              |
| **Y-Axis Left**  | Dollar amount ($0 to $18.00M) — for bars                                              |
| **Y-Axis Right** | Dollar amount ($0.00 to $60.00M) — for running total line                             |
| **Legend**       | Running Total (blue line), Base Spend (orange bars), Change Orders (yellow/gold bars) |

**Tooltip shown (Nov 25):**

- Running Total: $32.42M
- Base Spend: $4.41M
- **Change Orders: $0.00** ← Bug

**Bar data visible:**

| Month      | Base Spend (orange) | Change Orders (yellow) | Running Total (blue line) |
| ---------- | ------------------- | ---------------------- | ------------------------- |
| Mar 25     | ~$0.5M              | $0                     | ~$0.5M                    |
| Apr 25     | ~$2M                | $0                     | ~$2.5M                    |
| May 25     | ~$4M                | $0                     | ~$6.5M                    |
| Jun 25     | ~$3M                | $0                     | ~$9.5M                    |
| Jul–Sep 25 | Low values          | $0                     | Gradual increase          |
| Oct 25     | ~$3M                | $0                     | ~$28M                     |
| Nov 25     | **~$4.41M**         | **$0** (red circle)    | $32.42M                   |
| Dec 25     | ~$2M                | $0                     | ~$34M                     |
| Jan 26     | ~$10M               | $0                     | ~$44M                     |
| Feb 26     | ~$16M               | $0                     | ~$60M                     |

### Bug Details

- Change Orders bar (yellow/gold) appears as $0.00 for EVERY month in the chart
- The dashboard knows there are 297 COs worth $11.99M (shown in GSA KPIs)
- But the Annual Spend Trend chart is not splitting CO values into the correct months
- Likely the chart logic doesn't correctly identify which POs are change orders when grouping by month
- The tooltip confirms: "Change Orders: $0.00" for Nov 25, which is incorrect

### Analysis Needed

- Check how the chart groups POs into Base vs Change Order categories by month
- Verify `isChangeOrder` field is being used correctly in the chart data preparation
- CO POs should be separated from Base POs when building monthly bar data
- **Stakeholder expectation: Change Orders must be shown as a separate visible bar segment in each month where they exist**

---

## Q15: Most Inactive Suppliers — Should Hide When Filtering by Supplier (GSA Tab)

### Stakeholder Comment

> "When we do filter by supplier or any other option like project for example we should not show the most inactive supplier, we should hide that, its giving a complete contradiction, like you see I clicked on a supplier and on the right it's still showing the same supplier in "most inactive"

### Screenshot Description

- **Tab:** Global Spend Analysis (GSA)
- **Filter Applied:** Supplier = "Oman Cables Industry (SAOG)"
- **"Most Inactive Suppliers" section** on the right side still displays "Oman Cables Industry (SAOG)" as the #1 inactive supplier
- This creates a contradiction — the user selected this supplier to view its data, and the dashboard labels it as "inactive"
- The stakeholder expects the "Most Inactive Suppliers" card to be **hidden entirely** when any filter is applied (supplier, project, etc.)

### Analysis Needed

- Identify the "Most Inactive Suppliers" component in GSA tab
- When ANY filter is active (supplier, project, entity, etc.), hide the Most Inactive Suppliers card entirely
- The card should only be visible when viewing unfiltered/global data
- **Stakeholder expectation: The "Most Inactive Suppliers" section should be hidden when any GSA filter is applied**

---

## Q16: Material and Material Code Filters Show Same Data (All Tabs)

### Stakeholder Comment

> "I think these 2 filters are reading the same information from Material Code, i.e. Discipline. I saw the data in '01_GSA_PO_Workbench' and it seems the same data is copied in both columns 'Material' and 'Material Code' leading to this inconsistency. Material Code is essentially the Discipline and there are 13 of these disciplines. Refer above note."

### Screenshot Description

- **Filters shown:** "MATERIAL" dropdown (showing "All Materials") and "MATERIAL CODE" dropdown (showing "All Material Codes") side by side
- Both filters appear to contain the same data — the 12-13 discipline/material code categories
- The "Material" filter should contain individual material names (e.g., "Cable Tray", "Fire Alarm Panel"), while "Material Code" should contain discipline categories (e.g., "Electrical", "Fire", "Mechanical")
- **Data issue:** The pipeline (`build_v8_data.py`) may be copying the Material Code value into both the `material` and `materialCode` fields

### Analysis Needed

- Check the Python data pipeline (`v9/data/build_v8_data.py`) to see how `material` and `materialCode` fields are populated
- Verify the source Excel columns — "Material" should map to specific material names, "Material Code" to discipline categories
- Check all 3 JSON data files (`sm_data.json`, `gsa_data.json`, `md_data.json`) to confirm whether the fields contain distinct values
- In `scripts.js`, verify that the Material filter populates from `material` field and Material Code filter from `materialCode` field
- **Stakeholder expectation: Material filter should show ~30 individual material names, Material Code should show 12-13 discipline categories — they must be distinct**

---

## Q17: PO Spend Charts Counting Change Orders at Full Value Instead of Incremental (GSA Tab)

### Stakeholder Comment

> "I think this List is counting the change orders in full value, rather than deducting from the previous version with the same logic to count the Change Order Value above. I came to know about that because for instance, as part of the Top Suppliers, for Oman Cables for instance, we have not spend $7.63M. I think what happened is that its counting all the change orders as full amounts."

### Screenshot Description

- **Tab:** Global Spend Analysis (GSA)
- **4 horizontal bar charts visible:**
  - **Spend by Entity** (top-left): Top 8 entities by PO Value — MACRO leads at ~$160M
  - **Spend by Projects** (top-right): Top 8 projects by PO Value — ORD-002-1590A-1 leads at ~$19M
  - **Top 10 Suppliers** (bottom-left): Top 10 suppliers by spend — Rastra Bhuvan Construction leads at ~$80M, Oman Cables Industry (SAOG) shows ~$7.63M
  - **Most Inactive Suppliers** (bottom-right): Bottom 10 suppliers by spend — Quality Pest Control at ~$95M appears inflated
- **Issue:** Change Orders (e.g., PO-1234-2, PO-1234-3) are being summed at their full face value instead of computing the incremental difference from the previous version
- **Example:** Oman Cables showing $7.63M total spend, but stakeholder says actual spend is lower — the CO revisions are being double-counted (each CO version's full amount added instead of just the delta)

### Analysis Needed

- Check how `Spend by Entity`, `Spend by Projects`, `Top Suppliers`, and `Most Inactive Suppliers` charts aggregate PO values
- For change order groups (same base PO number), only the **latest revision** value should be counted — NOT the sum of all revisions
- Alternatively, CO value = latest revision value minus previous revision value (incremental), and total spend = base PO + incremental COs
- Verify the CO KPI card logic (which shows $11.99M) and ensure the same deduction logic is applied to these bar charts
- **Stakeholder expectation: Charts should use the same CO deduction logic as the CO KPI — only count incremental change order values, not full face values of each revision**

---

## Q18: GSA PO Table Values Should Include Tax (GSA Tab)

### Stakeholder Comment

> "Is this with Tax or without tax. I think the values read here are without TAX. It should be with."

### Screenshot Description

- **Tab:** Global Spend Analysis (GSA) — PO Workbench table
- **Table columns visible:** PO NO., TYPE, ORDER ID, PROJECT, PO DATE, SUPPLIER, MATERIAL, PO VALUE (US$), TAX (US$)
- **3 sample rows shown:**
  - RFPO-7039-V40019B-1 | Base | RFPO-7039-V40019B | PO for Cable Racks (Electrical and Telec... | 06 Aug 2025 | Underground Devices, Inc. | Various | $304.3K | -
  - RFPO-7039-V40019A-1 | Base | RFPO-7039-V40019A | PO for Cable Rack | 12 Jun 2025 | Underground Devices, Inc. | Various | $387.0K | -
  - RFPO-7039-V40019-1 | Base | RFPO-7039-V40019 | PO for Cable Rack | 04 Jun 2025 | Underground Devices, Inc. | Various | $305.4K | -
- **Issue:** The "PO VALUE (US$)" column appears to show net values (without tax), and the TAX column shows "-" (no tax data)
- The stakeholder expects PO VALUE to include tax (i.e., show the gross total = net + tax)

### Analysis Needed

- Check whether the GSA PO table's "PO VALUE (US$)" column uses `valueUSD`/`poSpendUSD` (net) or includes `taxUSD`
- Determine if the table should display `netTotalUSD` (which includes tax) instead of `poSpendUSD`
- Also check if the TAX column is correctly populated from the `taxUSD` field in the data
- Verify that KPI cards, charts, and table all use consistent tax-inclusive values
- **Stakeholder expectation: PO VALUE column in the GSA table should show tax-inclusive amounts (net + tax)**

---

## Q19: M&D Tab — Material Filter Not Updating Data & Rename "Material Code" to "Disciplines" (M&D Tab)

### Stakeholder Comment

> "Material and Material Code: In the KPI, the materials and material codes look good, they are filtering. But then when I apply the filter to any specific material, the data does not change and it shows the Material Code (Discipline) only. Firstly, can we rename the Material Code as Disciplines?"

### Screenshot Description

- **Tab:** Materials & Disciplines (M&D)
- **Image 1 — Filter bar:** Shows MATERIAL CODE dropdown ("All Material Codes"), MATERIAL dropdown ("All Materials"), ENTITY, PROJECT, SUPPLIER filters, plus YEAR, FROM/TO date pickers and Search bar with Clear button
- **Image 2 — KPI cards:** MATERIALS: 33 (All records) | MATERIAL CODES: 12 (All records) | TOTAL MATERIAL SPEND: $414.34M (160.4% conversion) | TOTAL MATERIAL CODE SPEND: $414.34M (160.4% conversion) | ACTIVE PROJECTS: 3210 (2189 suppliers)
- **Image 3 — Material Code dropdown expanded:** Shows 12 values: Architectural, Chemicals, Electrical, Fire, Logistics, Mechanical, Office Assets, Protection, Rental, Services, Tools, Various
- **Image 4 — Material dropdown expanded:** Shows 20+ individual material names: Accessories/Connection for Sandwich Panel, Architectural, Building Materials, Chemicals, Computer Peripherals, Construction, Containers, Design, Doors, Electrical, Fire, Firestop/DC 315, Fit Out Project, LSA - Life Support Area, Logistics, Machine/Equipments, Mechanical, Mechanical Items, Misc., etc.
- **Issue A:** When a specific Material is selected from the filter, the charts/data below do NOT update — they continue to show Material Code (discipline) level data only
- **Issue B:** "Material Code" should be renamed to "Disciplines" throughout the M&D tab (filter label, KPI card, charts, table headers)

### Analysis Needed

- Check `applyMdFilters()` in `scripts.js` to verify that Material filter selection actually filters the data
- Ensure charts and tables on M&D tab respond to material-level filtering, not just material code level
- Rename all occurrences of "Material Code" to "Disciplines" on the M&D tab:
  - Filter dropdown label
  - KPI card title ("MATERIAL CODES" → "DISCIPLINES")
  - KPI card title ("TOTAL MATERIAL CODE SPEND" → "TOTAL DISCIPLINE SPEND")
  - Any chart titles or axis labels
  - Table column headers
- **Stakeholder expectation: (A) Material filter must update all M&D data/charts, (B) Rename "Material Code" to "Disciplines" across the entire M&D tab**

---

## Q20: Material Filter Not Cascading from Discipline & Material Column Shows Discipline Data (M&D Tab)

### Stakeholder Comment

> "If I filter by Material Code, let's say I chose Architectural. According to point no. 8 above, it should have 8 materials within this discipline. So automatically, the filter of Material should show for me only 8 materials and not all the list of materials. Currently the materials filter continues to list for me all the materials and not the 8 specific ones that fall under Architectural. And this is impacting the rest of the filters as they are not showing the material, but only the material code."
>
> "Material and Material code are appearing the same. Refer the respective columns in the below snapshot."
>
> **Phase 2 note:** "A general comment, perhaps we take this to phase 2. It is important that we embed the export feature in some of these lists, for instance after applying some filters and all. We can talk about it once everything is completed."

### Screenshot Description

- **Image 1 — Dashboard with Architectural selected:**
  - Material Code filter set to "Architectural", Material dropdown expanded showing ALL materials (not filtered to Architectural's 8)
  - Material list shows: Accessories/Connection for Sandwich Panel, Architectural, Building Materials, Chemicals, Computer Peripherals, Construction, Containers, Design, Doors, Electrical, Fire, Firestop/DC 315, Fit Out Project, LSA - Life Support Area, Logistics, Machine/Equipments, Mechanical, Mechanical Items, Misc.
  - KPI cards: MATERIALS: 8 | MATERIAL CODES (partially hidden) | TOTAL MATERIAL SPEND: $5.24M (38.6% conversion) | TOTAL MATERIAL CODE SPEND: $5.24M (38.6% conversion) | ACTIVE PROJECTS: 101 (44 suppliers)
  - Charts visible: "Total Spend by Material C..." bar chart and "Material Distribution" doughnut (showing only Architectural)
  - Bottom cards: "Supplier Overview" and "Approved Materials" partially visible
- **Image 2 — PO/Material Details table (circled columns):**
  - Table title: "PO/Material Details — Detailed PO view linked to material/discipline"
  - Columns: PO NUMBER, PO DATE, MATERIAL, MATERIAL CODE, PO VALUE (USD), CURRENCY, PROJECT
  - **Red circle highlighting:** Both MATERIAL and MATERIAL CODE columns show identical values — "Architectural" in every row
  - This confirms the data issue: the `material` field contains the same discipline/code value instead of specific material names (e.g., should show "Paints", "Steel Mirrors", "Door Stopper" etc.)

### Analysis Needed

- **Cascading filter:** When a Material Code (Discipline) is selected, the Material dropdown must be filtered to show ONLY the materials belonging to that discipline (e.g., Architectural → 8 specific materials per MATERIAL_RAW_COUNTS)
- **Data pipeline fix:** The `material` field in `md_data.json` contains discipline names instead of actual material names — this is a pipeline issue in `build_v8_data.py`
- **Table columns:** The PO/Material Details table shows identical values in MATERIAL and MATERIAL CODE columns — confirming the underlying data problem from Q16
- **Phase 2 export:** Stakeholder wants embedded CSV/Excel export feature for filtered table views (noted for future phase)
- **Stakeholder expectation: (A) Material dropdown must cascade/filter based on selected Discipline, (B) Material and Material Code must contain DISTINCT data in the pipeline**

---

## Resolution Status

| Question                                                                                     | Status                            |
| -------------------------------------------------------------------------------------------- | --------------------------------- |
| Q1: PO Count (3,613 vs 3,620)                                                                | ⏳ Pending                        |
| Q2: PO Values ($412.6M vs $414.34M)                                                          | ⏳ Pending                        |
| Q3: CO Values ($12.0M vs $11.99M)                                                            | ⏳ Pending                        |
| Q4: Quote Value — include tax in total ($259.87M)                                            | ⏳ Pending                        |
| Q5: Decimal precision — standardize to 2 decimals                                            | ⏳ Pending                        |
| Q6: Missing 5th status "Quotation Closed"                                                    | ⏳ Pending (waiting for new data) |
| Q7: PO/CO KPIs not updating on filter                                                        | ⏳ Pending                        |
| Q8: Material Distribution → Pie only, rename to "Discipline Distribution", mapping reference | ⏳ Pending                        |
| Q9: Supplier List not filtering by Project/Entity                                            | ⏳ Pending                        |
| Q10: Map not showing all countries & not updating on supplier filter                         | ⏳ Pending                        |
| Q11: Multiple components not updating on supplier filter (A-D)                               | ⏳ Pending                        |
| Q12: Quotation to PO Time not updating on any filter                                         | ⏳ Pending                        |
| Q13: Submit & Order Quantity not updating on any filter                                      | ⏳ Pending                        |
| Q14: Annual Spend Trend — CO values showing $0 across all months                             | ⏳ Pending                        |
| Q15: Most Inactive Suppliers — hide when any filter applied                                  | ⏳ Pending                        |
| Q16: Material & Material Code filters show same data                                         | ⏳ Pending                        |
| Q17: PO spend charts counting COs at full value, not incremental                             | ⏳ Pending                        |
| Q18: GSA PO table values should include tax                                                  | ⏳ Pending                        |
| Q19: M&D Material filter not updating data + rename "Material Code" to "Disciplines"         | ⏳ Pending                        |
| Q20: Material filter not cascading from Discipline + Material=Discipline data issue          | ⏳ Pending                        |

---

_Created: March 2, 2026_
