# New Data Analysis Report — Feb 20, 2026 Export

> **Source folder:** `v8/Re_ Main order XLS and Export feature ready for use/`  
> **Analysis date:** February 21, 2026  
> **Purpose:** Evaluate new PO & Quotation data with `Main Order ID` and `Order ID` fields for v9

---

## 1. Files Received

| File | Records | Size |
|------|---------|------|
| `PO_List_Feb-20-2026.xls` | 3,613 POs | 1.3 MB |
| `Quotation_Report_Feb-20-2026.xls` | No 1–3000 | 1.0 MB |
| `Quotation_Report_Feb-20-2026 (1).xls` | No 3001–6000 | 1.4 MB |
| `Quotation_Report_Feb-20-2026 (2).xls` | No 6001–9000 | 1.4 MB |
| `Quotation_Report_Feb-20-2026 (3).xls` | No 9001–12000 | 1.5 MB |
| `Quotation_Report_Feb-20-2026 (4).xls` | No 12001–12215 | 0.2 MB |
| **Combined Quotations** | **12,215 records** | **~5.6 MB** |

No duplicate `No` values across files — clean sequential split.  
59 duplicate Quotation Numbers exist (same Q-number with different No/OrderID — likely revisions).

---

## 2. Column Schemas

### PO List (9 columns)
| # | Column | Sample | Notes |
|---|--------|--------|-------|
| 0 | No | 1 | Sequential row number |
| 1 | PO number | `RFPO-1569-V4435-1` | Format: `{prefix}-{MainOrderID}-{code}-{version}` |
| 2 | Po Date | `20 Feb 2026` | Text date |
| 3 | PO Name | `PO for Consumable/Service items…` | Description |
| 4 | Supplier | `NEW SMART OFFICE AUTOMATION LLC` | Supplier name |
| 5 | Total | 2040.0 | Numeric value |
| 6 | Cur. | `AED` | Currency code |
| 7 | **Main Order ID** | 1569 | **NEW** — Project Number |
| 8 | **Order ID** | 8496 | **NEW** — Order-level linkage |

### Quotation Report (16 columns)
| # | Column | Sample | Notes |
|---|--------|--------|-------|
| 0 | No | 3001 | Sequential row number |
| 1 | Number | `Q-1192-F12160` | Format: `Q-{MainOrderID}-{code}` |
| 2 | Company | `FIRESTOP` | Entity/Company |
| 3 | Date | `18 Nov 2022` | Text date |
| 4 | Type | `IQ` or `RFQ` | Quotation type |
| 5 | Client | `Arki G.D.` | Client name |
| 6 | Project Name | Full project description | |
| 7 | Description | Item description | |
| 8 | Material | `Firestop/ DC 315` | Material category |
| 9 | Material Code | `Fire` | Material code |
| 10 | Quo. Value | 2614.5 | Numeric value |
| 11 | Cur. | `AED` | Currency code |
| 12 | MVL Contact | `Habib B.` | Responsible employee |
| 13 | Status | `Quotation` / `Order` / etc. | Outcome status |
| 14 | **Main Order ID** | 1192 | **NEW** — Project Number |
| 15 | **Order ID** | 11011 | **NEW** — Order-level linkage |

---

## 3. Main Order ID Analysis

**Main Order ID = Project Number** (confirmed 100%)

- The number after `RFPO-` in the PO number **always matches** Main Order ID
- Example: `RFPO-1569-V4435-1` → Main Order ID = **1569**
- Same pattern in Quotations: `Q-1192-F12160` → Main Order ID = **1192**

| Metric | PO | Quotation |
|--------|-----|-----------|
| Unique Main Order IDs | 96 | 110 |
| Shared (both) | 96 | 96 |
| PO-only | 0 | — |
| Quotation-only | — | 14 |

All 96 PO projects have matching quotations. 14 quotation projects have no POs yet.

---

## 4. Order ID Analysis

| Metric | PO | Quotation |
|--------|-----|-----------|
| Unique Order IDs | 3,346 | 12,215 |
| Shared (both) | 2,975 | 2,975 |
| PO-only | 371 | — |
| Quotation-only | — | 9,240 |

- 2,975 Order IDs link a PO to its corresponding quotation
- 371 POs have Order IDs not in quotation data (older POs)
- 9,240 quotations have no resulting PO (not converted)

---

## 5. Quotation Type Distribution

| Type | Count | % |
|------|-------|---|
| IQ (Internal Quotation) | 8,252 | 67.5% |
| RFQ (Request for Quotation) | 3,963 | 32.4% |
| Blank | 37 | 0.3% |

> **Note:** For the dashboard we only consider **RFQ** records (3,963), not IQ.

### RFQ-Only Breakdown by Status
*(To be analyzed further)*

---

## 6. Status Distribution (All Quotations)

| Status | Count |
|--------|-------|
| Order | 7,770 |
| Quotation | 3,852 |
| Waiting | 408 |
| Cancled *(typo)* | 185 |
| Blank | 37 |

---

## 7. Change Order Analysis (PO Suffix)

PO number format: `RFPO-{MainOrderID}-{code}-{version}`

The **last segment** (version) indicates:
- `1` = Original PO
- `2`, `3`, … = Change orders (revisions)

| Suffix | Count | Meaning |
|--------|-------|---------|
| 1 | 3,289 | Original PO (91%) |
| 2 | 223 | 1st change order |
| 3 | 49 | 2nd change order |
| 4 | 17 | 3rd change order |
| 5 | 6 | 4th change order |
| 6–19 | 29 | 5th+ change orders |

- **204 POs have change orders** (multiple versions of same base PO)
- **280 total change order lines** (PO versions > 1)
- **Maximum revisions on a single PO: 19** (`PO-1005-C6013`)

### Change Order Examples
```
PO-1005-C6013:  v1→v2→v3→…→v19  (18 change orders, same OrderID=1459)
PO-1005-E7005:  v1→v2→v3→v4      (3 change orders, same OrderID=3759)
PO-1005-A5306:  v1→v2→v3→v4      (3 change orders, same OrderID=1247)
```

> **Key finding:** Change orders share the **same Order ID** and same base PO number. Only the suffix changes.

---

## 8. Entity/Company Distribution

| Company | Quotations |
|---------|------------|
| FIRESTOP | 6,714 |
| MACRO | 2,703 |
| MICRON | 932 |
| MVL USA JV LLC | 670 |
| MVL USA, INC | 566 |
| MVL Nepal | 214 |
| MV LLC | 205 |
| Others (14) | 211 |

---

## 9. Currency Distribution

| Currency | POs | Quotations |
|----------|-----|------------|
| USD | 1,755 | 4,007 |
| AED | 1,236 | 7,596 |
| SAR | 169 | 146 |
| NPR | 170 | 170 |
| QAR | 112 | 126 |
| EURO | 74 | 77 |
| KWD | 35 | 35 |
| INR | 31 | 33 |
| GBP | 22 | 15 |
| Others | 9 | 10 |

---

## 10. Comparison with Old v8 Data

| Metric | Old (v8) | New (Feb 20) | Change |
|--------|----------|--------------|--------|
| PO records | 3,539 | 3,613 | +74 |
| Quotation records | 12,136 | 12,215 | +79 |
| PO columns | 9 nested fields | 9 flat columns | Simplified |
| Quotation columns | 17 nested fields | 16 flat columns | Simplified |
| **Main Order ID** | N/A (derived from PO#) | **Explicit field** | NEW |
| **Order ID** | N/A | **Explicit field** | NEW |
| Change order tracking | Not tracked | **Detectable via suffix** | NEW |

---

## 11. Data Quality Notes

| Issue | Detail |
|-------|--------|
| "Cancled" typo | 185 records — same spelling error as old data |
| `&amp;` encoding | HTML entities in some Description/Project Name fields |
| MainOrderID = 0 | Some older records have no project assignment |
| Blank MVL Contact | 2,550 quotations missing employee name |
| Blank type | 37 records with no IQ/RFQ type |
| Date format | Text dates (e.g. "20 Feb 2026"), not ISO |

---

## 12. Data Linkage Summary

```
┌─────────────────────────────────────────────────────────┐
│                    MAIN ORDER ID                        │
│              (= Project Number)                         │
│                                                         │
│   Groups all POs + Quotations for the SAME PROJECT      │
│   PO: RFPO-{MainOrderID}-…    Q: Q-{MainOrderID}-…     │
│   96 projects in PO, 110 in Quotation                   │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                     ORDER ID                            │
│              (= Order-level link)                       │
│                                                         │
│   Links specific Quotation → PO at individual level     │
│   2,975 shared Order IDs between PO & Quotation         │
│   Multiple POs can share same Order ID (change orders)  │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                  PO SUFFIX (version)                    │
│              (= Change Order tracking)                  │
│                                                         │
│   RFPO-1005-C6013-1  ← Original                        │
│   RFPO-1005-C6013-2  ← 1st Change Order                │
│   RFPO-1005-C6013-3  ← 2nd Change Order                │
│   Same Order ID, different suffix = revisions           │
└─────────────────────────────────────────────────────────┘
```

---

## 13. What This Enables for v9

1. **Project-level filtering** — Filter all POs + RFQs by Main Order ID
2. **Change Order tracking** — Count and display PO revisions
3. **RFQ-to-PO traceability** — Link quotation to resulting PO via Order ID
4. **Change Order value analysis** — Compare original vs revised PO values

---

## 14. Pending / To Investigate

- [x] Deep change order analysis — PO suffix patterns (see Section 15)
- [x] Letter suffixes (A-D) in quotation numbers — NOT change orders, they are quotation revisions (see Section 16)
- [x] RFQ-only cross-reference with PO via Order ID (see Section 17)
- [ ] Additional linkage field (user to advise)
- [ ] Verify Order ID linkage accuracy for RFQ→PO conversion tracking

---

## 15. Deep Change Order Analysis (PO Suffix = 1, 2, 3…)

### How Change Orders Work

PO number: `RFPO-{MainOrderID}-{code}-{VERSION}`

- **Version 1** = Original PO
- **Version 2, 3, 4…** = Change orders (additional requirements on top of the original)
- Same base PO number, same Order ID, increasing suffix
- The suffix is **always numeric** (1, 2, 3…) — confirmed: **zero POs have letter suffixes**

### Change Order Statistics

| Metric | Count |
|--------|-------|
| Order IDs with single PO (no change) | 3,154 |
| Order IDs with MULTIPLE POs (change orders) | 192 |
| Total PO lines in change order groups | 459 |

### Change Order Group Size Distribution

| POs per Order ID | Groups | Meaning |
|------------------|--------|---------|
| 2 POs | 150 | 1 change order |
| 3 POs | 26 | 2 change orders |
| 4 POs | 12 | 3 change orders |
| 5 POs | 3 | 4 change orders |
| 18 POs | 1 | 17 change orders (max) |

### Change Order Examples

**Example 1: Order ID 1459, Project 1005 (18 POs!)**
```
PO-1005-C6013-1   AED  75,000   04 May 2016  AL RAFID INSULATION
PO-1005-C6013-2   AED  30,000   15 May 2016  WALTON WATERPROOFING
PO-1005-C6013-3   AED 179,775   13 Jun 2016  Bayer Pearl LLC
PO-1005-C6013-4   AED  14,000   13 Jun 2016  DOVER GULF WATERPROOFING
...up to...
PO-1005-C6013-19  AED  29,960   14 Feb 2017  AL RAFID INSULATION
```
> Each version is a separate requirement/change on the same original order.
> **Different suppliers** can appear in change orders (not always the same vendor).

**Example 2: Order ID 5615, Project 4814 (same supplier, increasing values)**
```
RFPO-4814-M4105-1  AED 440,000   09 May 2022  ALIGN ELECTROMECHANICAL
RFPO-4814-M4105-2  AED 449,000   16 Aug 2022  ALIGN ELECTROMECHANICAL
RFPO-4814-M4105-3  AED 451,150   01 Feb 2023  ALIGN ELECTROMECHANICAL
RFPO-4814-M4105-4  AED 460,150   20 Sep 2023  ALIGN ELECTROMECHANICAL
RFPO-4814-M4105-5  AED 507,054   21 Sep 2023  ALIGN ELECTROMECHANICAL
```
> Same supplier, value increases with each change order = scope additions.

**Example 3: Order ID 7423, Project 6705 (3 same, then adjustment)**
```
RFPO-6705-M4101-1  USD 276,922   20 Dec 2024  TURTLE
RFPO-6705-M4101-2  USD 276,922   20 Dec 2024  TURTLE
RFPO-6705-M4101-3  USD 288,622   20 Dec 2024  TURTLE
RFPO-6705-M4101-4  USD 296,301   02 Sep 2025  TURTLE
```

### Key Insight: What is a "Change Order"?

The PO suffix **1, 2, 3…** represents:
- **The executed PO is the LATEST version** (highest suffix number)
- Earlier versions are superseded or are additional items on the same order
- **Two patterns observed:**
  1. **Same supplier, increasing value** = scope change / amendment
  2. **Different suppliers across versions** = multiple sub-orders under the same Order ID

---

## 16. Letter Suffixes in Quotation Numbers (A, B, C, D…)

### What Are They?

Letters A, B, C, D (up to P) appear at the **end of quotation codes**, NOT in PO numbers.

Example: `Q-1192-F10003` (original) → `Q-1192-F10003A` → `Q-1192-F10003B`

### These Are NOT Change Orders — They Are Quotation Revisions

| Evidence | Detail |
|----------|--------|
| Different Order IDs | Letter-suffixed quotes ALWAYS have a **different Order ID** from the original (0 shared out of 1,116 checked) |
| Different dates | Later dates than the original |
| Sometimes different values | Revised pricing |
| Sometimes different status | Original may be "Quotation", revision may be "Order" |

### Letter Suffix Distribution

| Letter | Count |
|--------|-------|
| A | 941 |
| B | 193 |
| C | 57 |
| D | 23 |
| E | 8 |
| F | 5 |
| G–P | 15 |
| **Total** | **1,242 quotations** |

Out of 12,215 total quotations, **1,242 (10.2%)** are revisions of an earlier quotation.

### Examples

```
Q-1192-F10003       OrderID=7177  Status=Quotation  AED 53,917  23 Oct 2019 (original)
Q-1192-F10003A      OrderID=7193  Status=Order      AED 44,599  27 Oct 2019 (revision A → won the order)
Q-1192-F10003B      OrderID=7801  Status=Order      AED  2,775  23 Feb 2020 (revision B → additional)

Q-1192-F10006       OrderID=7184  Status=Quotation   AED 192,581  24 Oct 2019 (original)
Q-1192-F10006A      OrderID=7185  Status=Quotation   AED  59,667  24 Oct 2019 (rev A)
Q-1192-F10006B      OrderID=7186  Status=Quotation   AED 186,320  24 Oct 2019 (rev B)
Q-1192-F10006C      OrderID=7187  Status=Quotation   AED 186,320  24 Oct 2019 (rev C)
```

> **Letter suffix = Quotation revision** (re-quoted to the same client)  
> **Numeric suffix on PO = Change order** (additional PO under same Order)

---

## 17. RFQ-Only Cross-Reference with PO

Since we only consider **RFQ** (not IQ) for the dashboard:

### RFQ ↔ PO Linkage via Order ID

| Metric | Count |
|--------|-------|
| Total RFQ records | 3,963 |
| RFQ Order IDs with matching PO | **612** |
| RFQ Order IDs without PO | 3,351 |
| PO Order IDs without matching RFQ | 2,734 |

### RFQ Status Breakdown

**When PO exists (612 RFQs):**
| Status | Count |
|--------|-------|
| Order | 582 (95%) |
| Quotation | 30 (5%) |

**When no PO exists (3,351 RFQs):**
| Status | Count |
|--------|-------|
| Order | 3,156 |
| Quotation | 71 |
| Waiting | 72 |
| Cancled | 52 |

### Important Note

3,156 RFQs show status "Order" but have **no matching PO via Order ID**. This could mean:
1. These POs exist but were linked via IQ (not RFQ) Order IDs
2. The Order ID linkage is indirect (via Main Order ID / project level, not direct match)
3. These orders resulted in POs that have different Order IDs

> **This confirms your note: Order ID alone is not sufficient for perfect RFQ→PO matching. An additional field may be needed for complete traceability.**

### RFQ → PO Matched Examples
```
OrderID=1247:
  RFQ: RFQ-573-1247   USD 93,810   Status=Order
  PO:  PO-1005-A5306-1  USD 5,968   (v1)
  PO:  PO-1005-A5306-2  AED 52,500  (v2 - change order)
  PO:  PO-1005-A5306-3  USD 7,478   (v3 - change order)
  PO:  PO-1005-A5306-4  AED 42,885  (v4 - change order)
```

---

## 18. Summary of Two Suffix Systems

| Feature | Quotation Letters (A, B, C…) | PO Numbers (1, 2, 3…) |
|---------|------------------------------|------------------------|
| **What it means** | Quotation revision/re-quote | Change order on PO |
| **Where** | End of quotation code | End of PO number |
| **Example** | `Q-1192-F10003A` | `RFPO-1005-C6013-2` |
| **Same Order ID?** | NO — each revision gets new Order ID | YES — all share same Order ID |
| **Count** | 1,242 revisions | 459 change order PO lines |
| **Relevance to dashboard** | Shows re-quoting activity | Shows PO amendments & scope changes |

---

*Updated: February 21, 2026. Ready for further investigation with additional linkage field.*
