# V8 Dashboard — Technical Documentation

**Last Updated:** February 25, 2026

---

# SM Tab Corrections

Corrections identified against the **01_SM_Workbench_Full** audit data (12,072 rows).

---

## Q1 — RFQ Count Incorrect

**Issue:** The "Request for Quotation" KPI shows **3,946** but should be **3,849** per `01_SM_Workbench_Full`.

**Screenshot reference:** Q1 image — RFQ KPI card showing 3,946

| Source | RFQ Count |
|--------|-----------|
| Dashboard (current) | 3,946 |
| 01_SM_Workbench_Full (expected) | **3,849** |
| Difference | +97 extra records |

### Root Cause Analysis

The pipeline (`build_v8_data.py`) filters quotations by `Type != 'IQ'` (column value), but the workbench counts only records with `RFQ-` prefix in the QuotationNumber.

**Excel source (5 fragments, 12,215 total rows):**

| Type Column | Count | After Dedup |
|-------------|-------|-------------|
| IQ | 8,252 | — (removed) |
| RFQ | 3,963 | **3,946** (current result) |

**By QuotationNumber prefix:**

| Prefix | Count | After Dedup |
|--------|-------|-------------|
| `RFQ-` | 3,939 | 3,922 |
| `Q-` | 8,275 | — |

**Two discrepancy factors:**

1. **25 Q-prefix records have Type=RFQ** (e.g., `Q-5213-V40007`, `Q-637-S9076`, `Q-415-1593`, `Q-214-799`, `Q-1213-669`). Pipeline keeps these because `Type == 'RFQ'`, but they are not true RFQs by quotation number convention.

2. **Excel has 143 more rows than the workbench CSV** (12,215 vs 12,072), contributing ~73 additional unique RFQ-prefix records not in the workbench (3,922 unique `RFQ-` in Excel vs 3,849 in CSV).

### Resolution

**✅ Implemented** — `build_v8_data.py` Step 2 now filters by **both** `Type == 'RFQ'` **and** `QuotationNumber.startswith('RFQ-')`.

| Metric | Before Fix | After Fix | Workbench Target |
|--------|-----------|-----------|-----------------|
| RFQ Count | 3,946 | **3,921** | 3,849 |

**Remaining gap (+72):** Excel source has ~143 more rows than the workbench CSV export. After dedup and RFQ- filter, 72 unique RFQ records exist in Excel but not in the workbench. This is a data source difference, not a logic error.

---

## Q2 — Quote Value Incorrect

**Issue:** The "Quote Value" KPI shows **$260.8M** but should be **$256.5M** per `01_SM_Workbench_Full`.

**Screenshot reference:** Q2 images — Quote Value KPI card showing $260.8M; workbench status bar showing Count: 3849, Sum: 256,530,648.9

| Source | Quote Value (USD) |
|--------|-------------------|
| Dashboard (current) | **$260,771,534.53** ($260.8M) |
| 01_SM_Workbench_Full (expected) | **$256,530,648.87** ($256.5M) |
| Difference | +$4,240,885.66 |

### Root Cause Analysis

This is a **direct consequence of Q1**. The same 97 extra records that inflate the RFQ count also inflate the total quote value by ~$4.24M.

**Quote value breakdown by filter approach:**

| Filter Method | Sum (USD) | Record Count |
|---------------|-----------|--------------|
| Type != IQ (current pipeline) | $260,771,534.53 | 3,946 |
| Type == RFQ (positive match) | $258,212,520.48 | 3,873 |
| RFQ- prefix only (workbench match) | **$256,530,648.87** | **3,849** |

### Resolution

**✅ Implemented** — Auto-corrected by Q1 fix. RFQ- prefix filter removes the extra records, reducing quote value.

| Metric | Before Fix | After Fix | Workbench Target |
|--------|-----------|-----------|-----------------|
| Quote Value | $260,771,534.53 | **$259,089,662.92** | $256,530,648.87 |

**Remaining gap (+$2.6M):** Due to the same 72 extra RFQ records in Excel vs workbench (see Q1). Proportionally consistent.

---

## Q3 — Purchase Orders Count & PO Values Incorrect

**Issue:** The "Purchase Orders" KPI shows **3,723** but should be **3,522**. The "PO Values" KPI shows **$238.1M** but should be **$396.0M** (~$396,041,496.7 USD). Additionally, SPOs (subcontract POs) should be excluded, and the KPI label should be renamed to "Total Purchase Orders" with a note "(including change orders)".

**Screenshot references:**
- Q3 image 1 — Purchase Orders KPI showing 3,723 and PO Values showing $238.1M
- Q3 image 2 — Workbench status bar showing Count: 3522, Sum: 396041496.7

| KPI | Dashboard (current) | Expected (workbench) |
|-----|---------------------|----------------------|
| Purchase Orders | **3,723** | **3,522** |
| PO Values | **$238,063,205.99** ($238.1M) | **$396,041,496.70** ($396.0M) |

### Root Cause Analysis

The SM tab currently computes "Purchase Orders" and "PO Values" from **quotation records** with `Status == 'Order'`, NOT from the actual **PO list data**:

```python
# Current pipeline (build_v8_data.py line 724-729)
orders = [q for q in clean_quotes if q['Status'] == 'Order']
total_orders = len(orders)                    # → 3,723 (quotation-based)
total_order_value = sum(to_usd(...) for q in orders)  # → $238.1M (quotation values)
```

This is fundamentally wrong because:
1. **Quotation records ≠ PO records** — the quotation Status='Order' count doesn't match the actual PO list
2. **Quotation values ≠ PO values** — PO spend amounts differ from original quotation values (POs may have different negotiated values, change orders, etc.)

The correct source is the **PO list data** (`02_GSA_Workbench_Full` / `gsa_data.json`):
- 3,522 POs (including 314 Change Orders + 3,208 Base POs)
- Total ValueUSD: $396,041,496.65
- Contains 7 SPO/RFSPO records (subcontract) to be excluded

### Required Changes

1. **Data source:** SM tab PO KPIs should use actual PO data (`gsa_data.json` / `clean_pos`), not quotation Status='Order'
2. **Exclude SPOs:** Filter out POs with `SPO` or `RFSPO` prefix (7 records, subcontract POs)
3. **Rename label:** "Purchase Orders" → "Total Purchase Orders"
4. **Add note:** Display "(including change orders)" under the KPI

### Resolution

**✅ Implemented** — Multiple changes across pipeline, JS, HTML, and CSS:

**Pipeline (`build_v8_data.py`):**
- SM summary now uses actual PO data (`clean_pos`) instead of quotation `Status='Order'`
- SPOs excluded: `po['poNumber'].startswith('SPO') or po['poNumber'].startswith('RFSPO')`
- PO FX conversion uses `to_usd_po()` — treats NPR and JPY as 1:1 with USD (matching GSA workbench behavior)
- Introduced `PO_FX_OVERRIDES = {'NPR': 1, 'JPY': 1}` — SM workbench converts NPR/JPY but GSA workbench does not

**Frontend (`index.html` + `styles.css`):**
- Label renamed: "Purchase Orders" → "Total Purchase Orders"
- Added sublabel: `<div class="kpi-sublabel">(incl. change orders)</div>`
- CSS: `.kpi-sublabel { font-size: 0.7rem; color: var(--text-secondary); opacity: 0.7; }`

**JS (`scripts.js`):**
- Filter path reads `smData.summary.totalPOs` / `smData.summary.totalPOSpendUSD` instead of computing from quotations

| Metric | Before Fix | After Fix | Workbench Target |
|--------|-----------|-----------|-----------------|
| PO Count | 3,723 | **3,589** | 3,522 |
| PO Spend | $238,063,205.99 | **$411,816,892.32** | $396,041,496.70 |

**Remaining gap (+67 POs / +$15.8M):** Excel has 76 POs not in the workbench CSV (3 workbench-only, 3,520 common). This is a data source difference.

**FX Rate Discovery:** The SM workbench converts NPR (÷133.5) and JPY (÷149.5) for quotation values, but the GSA workbench treats NPR and JPY as 1:1 for PO values. The pipeline now uses two conversion functions: `to_usd()` for quotations and `to_usd_po()` for POs.

---

## Q4 — Change Order Value Calculation Rules

**Issue:** The Change Order value is currently calculated as the **raw sum** of all CO PO spend amounts. It should instead be calculated as the **incremental difference** (deduction from previous version), with two special rules:

### Rules for CO Value Calculation

| Scenario | Rule | CO Value Contribution |
|----------|------|----------------------|
| **Same value as previous version** | No deduction — just count the CO | **$0** (count only) |
| **Version gap** (previous version not directly before, e.g., v1→v3 skipping v2) | No deduction — count as CO with full amount | **Full CO amount** |
| **Normal consecutive** (e.g., v1→v2, v2→v3) | Deduct previous version value | **CO amount − previous version amount** |

### Current vs Expected

| Metric | Current (raw sum) | Expected (deduction rules) |
|--------|-------------------|---------------------------|
| CO Count | 309 | 309 (unchanged — all 3 rules still count) |
| CO Value | **$30,036,794.20** | TBD (recalculated with deduction) |

### Breakdown by Rule

From analysis of 309 Change Orders (268 in multi-PO groups, 41 orphans):

| Category | Count | Current Handling |
|----------|-------|-----------------|
| Normal consecutive versions | 240 | Deduct previous version value |
| Same value as previous version | 20 | Value contribution = $0 (count only) |
| Version gap (non-consecutive) | 4 | Full CO amount (no deduction) |
| COs at group start (no previous version in data) | 4 | Full CO amount |
| Orphan COs (single-PO group, $2,056,791.45) | 41 | Full CO amount (no base to deduct from) |

**Examples — Same value (no deduction):**
- `RFPO-5829-S9105-1` → `RFPO-5829-S9105-2` (same value, count only)
- `RFPO-6705-M4101-1` → `RFPO-6705-M4101-2` (same value, count only)

**Examples — Version gap (full amount):**
- `RFPO-7139-V40031-1` (v1) → `RFPO-7139-V40031-3` (v3) — skips v2, full amount
- `PO-1005-C6013-14` (v14) → `PO-1005-C6013-16` (v16) — skips v15, full amount

### Resolution

**✅ Implemented** — `build_v8_data.py` Step 7 now applies deduction logic instead of raw sum.

**Logic implemented:**

| Scenario | Action |
|----------|--------|
| Orphan CO (single-PO group) | Full CO amount |
| CO at group start (index 0, no previous) | Full CO amount |
| Same value as previous version | $0 (count only) |
| Version gap (non-consecutive) | Full CO amount |
| Normal consecutive | `current_spend - previous_spend` |

**Results:**

| Metric | Before Fix (raw sum) | After Fix (deduction) |
|--------|---------------------|----------------------|
| CO Count | 309 | **309** (unchanged) |
| CO Value | $30,036,794.20 | **$10,591,207.24** |

**Breakdown:** 240 normal deductions, 20 same-value ($0), 4 version gaps (full), 41 orphans (full), 4 at group start (full)

---

## Q5 — Win Rate

**Issue:** Win rate should be calculated as `Total POs / Total RFQs` using actual PO count (from PO data, excluding SPOs) divided by RFQ count.

### Resolution

**✅ Implemented** — Pipeline Step 6 now computes: `win_rate = total_pos / total_quotations * 100`

| Metric | Before Fix | After Fix |
|--------|-----------|-----------|
| Win Rate | Status='Order' / Total Quotes | **Actual POs / RFQs = 91.5%** |

Win rate = 3,589 POs ÷ 3,921 RFQs = **91.5%**

---

## How We Identify Change Orders

Change Orders are **not** a separate field in the source Excel data. They are **derived** from two fields:

1. **Order ID** — Groups POs that belong to the same order
2. **PO Number Suffix** — The last segment of the PO number determines the version

---

## PO Number Structure

Every PO number follows this format:

```
RFPO-{MainOrderID}-{EntityCode}-{Version}
```

| Segment | Meaning | Example |
|---------|---------|---------|
| `RFPO` | Prefix (always "RFPO") | `RFPO` |
| `{MainOrderID}` | Links back to the original RFQ | `7139` |
| `{EntityCode}` | MVL entity/business unit code | `S9131` |
| `{Version}` | **Version number (determines CO)** | `1`, `2`, `3` |

**Rule:**
- Version `1` (suffix `-1`) → **Base PO** (the original order)
- Version `2+` (suffix `-2`, `-3`, etc.) → **Change Order** (modification to the base)

---

## Real Example: Order ID `8053`

This order has **3 POs** — 1 Base + 2 Change Orders:

| PO Number | Version | Type | Value (USD) |
|-----------|---------|------|-------------|
| `RFPO-7139-S9131-1` | 1 | **Base PO** | $105,413.98 |
| `RFPO-7139-S9131-2` | 2 | **Change Order** | $120,213.98 |
| `RFPO-7139-S9131-3` | 3 | **Change Order** | $132,020.60 |

All three share the **same Order ID** (`8053`) and the **same Main Order ID** (`7139`). The suffix at the end (`-1`, `-2`, `-3`) tells us which is the base and which are changes.

---

## Step-by-Step Pipeline Logic

### Step 1: Parse PO Number (extract version)

```python
def parse_po_number(po_num):
    parts = str(po_num).strip().split('-')
    # e.g. "RFPO-7139-S9131-2" → parts = ['RFPO', '7139', 'S9131', '2']
    version = int(parts[3])          # → 2
    isChangeOrder = version > 1      # → True (Change Order)
```

Each PO gets:
- `poVersion` = the suffix number (1, 2, 3, etc.)
- `isChangeOrder` = True if version > 1

### Step 2: Initial Classification (during PO loading)

```python
po['poType'] = 'Change Order' if po['isChangeOrder'] else 'Base PO'
```

This gives an initial classification based purely on the PO number suffix.

### Step 3: Group by Order ID (confirms CO groups)

```python
po_by_order_id = defaultdict(list)
for po in clean_pos:
    oid = po.get('orderId', '')
    if oid:
        po_by_order_id[oid].append(po)
```

POs with the **same Order ID** are grouped together.

### Step 4: Classify Within Each Group

```python
for oid, po_list in po_by_order_id.items():
    if len(po_list) == 1:
        # Only 1 PO with this Order ID → definitely a Base PO
        po_list[0]['changeOrderGroup'] = 1
        po_list[0]['changeOrderTotal'] = 1
    else:
        # Multiple POs share this Order ID → it's a CO group
        po_list.sort(key=lambda p: p.get('poVersion', 1))
        for po in po_list:
            po['changeOrderGroup'] = len(po_list)
            po['changeOrderTotal'] = len(po_list)
            if po['poVersion'] == 1:
                po['poType'] = 'Base PO'
            else:
                po['poType'] = 'Change Order'
```

Each PO in a group gets:
- `changeOrderGroup` = total POs in the group (e.g., 3)
- `changeOrderTotal` = same value (for display: "2 of 3")
- Classification re-confirmed from Order ID grouping

---

## Key Fields in Output JSON

| Field | Type | Description |
|-------|------|-------------|
| `poNumber` | string | Full PO number e.g. `RFPO-7139-S9131-2` |
| `orderId` | string | Shared across all POs in a CO group |
| `mainOrderId` | string | Links back to the original RFQ |
| `poVersion` | number | Extracted from PO suffix: 1, 2, 3... |
| `isChangeOrder` | boolean | True if poVersion > 1 |
| `poType` | string | `"Base PO"` or `"Change Order"` |
| `changeOrderGroup` | number | Total POs sharing the same Order ID |
| `changeOrderTotal` | number | Same as changeOrderGroup |

---

## Current Data Summary

| Metric | Count |
|--------|-------|
| Total POs | 3,596 |
| Base POs | 3,287 |
| Change Orders | 309 |
| CO Groups (unique Order IDs with multiple POs) | 191 |

---

## Orphan Change Orders

Some POs have a suffix > 1 (making them Change Orders by PO number) but their Order ID only has **one PO** in the dataset. These are called **orphan COs** — the base PO may not be in the current export.

- Orphan COs still have `poType = "Change Order"` and `isChangeOrder = true`
- But `changeOrderTotal = 1` (only one PO in the group)
- The GSA KPI subtext **excludes** orphan COs from the group count (filters by `changeOrderTotal > 1`)

---

## How It Shows in the Dashboard

### GSA Tab KPIs
- **Total POs** = Base POs + Change Orders (all POs)
- **Change Orders** = Count where `poType === "Change Order"` 
- **CO Groups** (subtext) = Unique Order IDs with `changeOrderTotal > 1`
- **CO Amount** = SUM of `valueUSD` for Change Order POs
- **CO % of Total Spend** = CO Amount ÷ Total Spend × 100

### PO Table
- Each PO row shows a **badge**: green "Base" or red "CO"
- CO group indicator shows position: "2 of 3" in gold badge
- Sorted by Order ID to keep groups together

### SM Tab
- SM tab shows CO Count and CO Value from GSA data (not from quotations)
- These values do **not** change when SM filters are applied

---

## Visual Flow

```
PO Excel Export
    │
    ▼
Parse PO Number → Extract suffix (-1, -2, -3)
    │
    ▼
Initial Classification → poVersion=1? Base PO : Change Order
    │
    ▼
Group by Order ID → Multiple POs with same Order ID?
    │                        │
    │ (only 1 PO)           │ (2+ POs = CO Group)
    ▼                        ▼
Single Base PO         Sort by version, classify:
                       - Version 1 → Base PO
                       - Version 2+ → Change Order
                       - Set changeOrderTotal = group size
    │                        │
    ▼                        ▼
        Output: gsa_data.json + change_orders.json
```
