# V5 Data Files

## Files

### orders.json
Main Order/Project data from Order_LIST_Feb-12-2026.csv.

**Source:** `Data/Order_LIST_Feb-12-2026.csv`
**Records:** 210 orders

**Structure:**
```json
{
  "No": "1",
  "Order Number": "ORD-8473",
  "Order Date": "Feb 19, 2026",
  "Client Name": "Us A.",
  "Supply of": "WMJ0159893",
  "Destination": "US"
}
```

**Key Stats:**
| Metric | Value |
|--------|-------|
| Total Orders | 210 |
| Top Destinations | Kuwait (35), Diego Garcia (36), Qatar (18) |
| Top Clients | USACE (~80), NAVFAC (~25), Regional C.C. (22) |
| Date Range | Oct 2024 - Feb 2026 |

**Usage:** Available for any tab - may be used for project filtering, destination mapping, or client analytics.

---

### material_codes.json
Material code reference for RFQ/PO numbering system.

**Contents:**
- 30 material types with code letters and ranges
- RFQ/PO relationship documentation
- Material code to letter mapping

**Usage:**
```javascript
// Parse material code from RFQ number
const rfq = "RFQ-7139-V4359-1";
const materialLetter = rfq.split('-')[2][0]; // "V"
const materialCode = letterToMaterialCode[materialLetter]; // "Various"
```

### dashboard_data.json
Unified data for all dashboard tabs.

**Structure:**
```json
{
  "lastRefresh": "ISO date",
  "summary": { ... },
  "supplierMarketplace": { ... },
  "globalSpendAnalysis": { ... },
  "materialsAndDisciplines": { ... }
}
```

---

## RFQ/PO Numbering System

### Format
- **RFQ:** `RFQ-{sequence}-{material_letter}{material_number}-{version}`
- **PO:** `RFPO-{sequence}-{material_letter}{material_number}-{order_type}`

### Order Type Meaning
| Value | Type |
|-------|------|
| 1 | Main Order (PO) |
| 2+ | Change Order (CO) |

### Example
```
RFQ-7139-V4359-1  →  RFPO-7139-V4359-1 (Main PO)
                 →  RFPO-7139-V4359-2 (Change Order)
```

---

## Material Code Letters

| Material Code | Letter | Example Range |
|---------------|--------|---------------|
| Architectural | A | 5000-5400 |
| Chemicals | C | 6000-6100 |
| Electrical | E | 6800-6999 |
| Fire | F | 7000-7999 |
| Logistics | L | 4000-4999, 7000-7999 |
| Mechanical | M | 4000-4200 |
| Office Assets | O | 1-100 |
| Protection | P | 4800-4900 |
| Rental | R | 1500-1600 |
| Services | S | 9000-9200 |
| Tools | T | 1000-1100 |
| Various | V | 4200-4500, 40000-50000 |

---

_Last updated: February 12, 2026_
