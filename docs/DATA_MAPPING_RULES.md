# MVL Supply Intel Hub - Data Mapping Rules

**Source:** Email from Rita El Jamal  
**Date Documented:** 30 January 2026  
**Purpose:** Critical business rules for data transformation

---

## 1. Document Numbering Convention

### RFQ (Request for Quotation) Format
```
RFQ-[PROJECT#]-[MATERIAL_CODE][SEQUENCE]-[VERSION]

Example: RFQ-7139-V4359-1
         │     │    │ │    │
         │     │    │ │    └── Version/Order number
         │     │    │ └─────── Sequence number (4359)
         │     │    └───────── Material Letter Code (V = Various)
         │     └────────────── Project/Reference number
         └──────────────────── Document type prefix
```

### RFPO (Purchase Order) Format
```
RFPO-[PROJECT#]-[MATERIAL_CODE][SEQUENCE]-[ORDER_TYPE]

Example: RFPO-7139-V4359-1  (Main/Base Order)
Example: RFPO-7139-V4359-2  (Change Order)
```

### RFQ to PO Linking Rule
| RFQ Number | Links To | PO Type |
|------------|----------|---------|
| RFQ-7139-V4359-1 | RFPO-7139-V4359-1 | Base Order |
| RFQ-7139-V4359-1 | RFPO-7139-V4359-2 | Change Order |

**Key Pattern:** Same middle numbers link the documents:
- `7139-V4359` is the linking key
- Last digit determines order type

---

## 2. Order Type Classification

| Last Digit | Order Type | Description |
|------------|------------|-------------|
| 1 | Base Order | Original/Main purchase order |
| 2 | Change Order | Modification to base order |
| 3+ | Additional Changes | Subsequent modifications |

---

## 3. Material Letter Codes (in Document Numbers)

The letter in the document number (e.g., **V** in V4359) indicates the material category:

| No | Material Code | Letter | Example |
|----|---------------|--------|---------|
| 1 | Architectural | A | A5000 |
| 2 | Chemicals | C | C6000 |
| 3 | Electrical | E | E6800 |
| 4 | Fire | F | F7000 |
| 5 | Logistics | L | L4000 |
| 6 | Mechanical | M | M4000 |
| 7 | Protection | P | P4800 |
| 8 | Rental | R | R1500 |
| 9 | Services | S | S9000 |
| 10 | Tools | T | T1000 |
| 11 | Various | V | V4200 |
| 12 | Consumables | C | C6000 |
| 13 | Office Assets | O | O0001 |

**Note:** Chemicals and Consumables share the letter 'C' - differentiate by code range.

---

## 4. Material Name to Material Code Mapping

| No | Material Name | Material Code | Code Range |
|----|---------------|---------------|------------|
| 1 | Polyurethane Foam | Chemicals | 6000 - 6050 |
| 2 | Firestop/ DC 315 | Fire | 7000 - 7999 |
| 3 | Sandwich Panel | Architectural | 5000 - 5100 |
| 4 | Accessories / Connection for Sandwich Panel | Architectural | 5101 - 5150 |
| 5 | Steel Coil | Architectural | 5151 - 5200 |
| 6 | Containers | Various | 4200 - 4250 |
| 7 | Doors | Architectural | 5201 - 5250 |
| 8 | Windows | Architectural | 5251 - 5300 |
| 9 | Transportation | Logistics | 4000 - 4999 |
| 10 | Discount | Logistics | 0 - 0 |
| 11 | Machine / Equipments | Mechanical | 4000 - 4100 |
| 12 | Electrical | Electrical | 6800 - 6999 |
| 13 | Design | Services | 9000 - 9030 |
| 14 | Fit Out Project | Architectural | 0 - 0 |
| 15 | Building Materials | Various | 40000 - 50000 |
| 16 | Mechanical Items | Mechanical | 4101 - 4200 |
| 17 | Paints | Architectural | 5301 - 5350 |
| 18 | Rental | Rental | 1500 - 1600 |
| 19 | Chemicals | Chemicals | 6051 - 6100 |
| 20 | Graco Spares | Various | 4301 - 4350 |
| 21 | Sanitary and Toilet Accessories | Architectural | 5351 - 5400 |
| 22 | Construction | Services | 9031 - 9050 |
| 23 | Misc. | Various | 4351 - 4500 |
| 24 | Tools | Tools | 1000 - 1100 |
| 25 | PPE | Protection | 4800 - 4900 |
| 26 | LSA - Life Support Area | Services | 9051 - 9070 |
| 27 | Subcontract | Services | 9071 - 9090 |
| 28 | Computer Peripherals | Office Assets | 1 - 100 |
| 29 | MHE | Logistics | 7000 - 7999 |
| 30 | Services | Services | 9100 - 9200 |

---

## 5. Material Code Summary by Category

### Architectural (Code: A)
| Material Name | Range |
|---------------|-------|
| Sandwich Panel | 5000 - 5100 |
| Accessories / Connection for Sandwich Panel | 5101 - 5150 |
| Steel Coil | 5151 - 5200 |
| Doors | 5201 - 5250 |
| Windows | 5251 - 5300 |
| Paints | 5301 - 5350 |
| Sanitary and Toilet Accessories | 5351 - 5400 |
| Fit Out Project | 0 - 0 (Special) |

### Chemicals (Code: C)
| Material Name | Range |
|---------------|-------|
| Polyurethane Foam | 6000 - 6050 |
| Chemicals | 6051 - 6100 |

### Electrical (Code: E)
| Material Name | Range |
|---------------|-------|
| Electrical | 6800 - 6999 |

### Fire (Code: F)
| Material Name | Range |
|---------------|-------|
| Firestop/ DC 315 | 7000 - 7999 |

### Logistics (Code: L)
| Material Name | Range |
|---------------|-------|
| Transportation | 4000 - 4999 |
| Discount | 0 - 0 (Special) |

### Mechanical (Code: M)
| Material Name | Range |
|---------------|-------|
| Machine / Equipments | 4000 - 4100 |
| Mechanical Items | 4101 - 4200 |

### Various (Code: V)
| Material Name | Range |
|---------------|-------|
| Containers | 4200 - 4250 |
| Building Materials | 40000 - 50000 |
| Graco Spares | 4301 - 4350 |
| Misc. | 4351 - 4500 |

### Services (Code: S)
| Material Name | Range |
|---------------|-------|
| Design | 9000 - 9030 |
| Construction | 9031 - 9050 |
| LSA - Life Support Area | 9051 - 9070 |
| Subcontract | 9071 - 9090 |
| Services | 9100 - 9200 |

### Protection (Code: P)
| Material Name | Range |
|---------------|-------|
| PPE | 4800 - 4900 |

### Rental (Code: R)
| Material Name | Range |
|---------------|-------|
| Rental | 1500 - 1600 |

### Tools (Code: T)
| Material Name | Range |
|---------------|-------|
| Tools | 1000 - 1100 |

### Office Assets (Code: O)
| Material Name | Range |
|---------------|-------|
| Computer Peripherals | 1 - 100 |

---

## 6. Data Transformation Logic

### Extract Material Code from Document Number
```
Document: RFQ-7139-V4359-1
                   │
                   └── Extract letter 'V' → Material Code = 'Various'
```

### Parse Logic (Pseudo-code)
```python
def parse_document_number(doc_num):
    # Example: RFQ-7139-V4359-1 or RFPO-7139-V4359-1
    parts = doc_num.split('-')
    
    doc_type = parts[0]           # RFQ or RFPO
    project_ref = parts[1]        # 7139
    material_seq = parts[2]       # V4359
    order_version = parts[3]      # 1 or 2
    
    material_letter = material_seq[0]  # V
    sequence_num = material_seq[1:]    # 4359
    
    # Determine order type
    if doc_type == 'RFPO':
        order_type = 'Base' if order_version == '1' else 'Change Order'
    
    # Create linking key
    linking_key = f"{project_ref}-{material_seq}"  # 7139-V4359
    
    return {
        'doc_type': doc_type,
        'project_ref': project_ref,
        'material_code': get_material_code(material_letter),
        'sequence': sequence_num,
        'order_type': order_type,
        'linking_key': linking_key
    }
```

---

## 7. Input Data Files

### Expected Files (from email)
1. **Quotations** - All RFQ records (~12,411 since June 2012)
2. **POs** - All RFPO records
3. **List of Existing Suppliers** - Supplier/Client directory

### File Location
Folder: `Re_ Quotation, PO and Expediting Modules Enhancement - Microtrack`

---

## 8. Data Quality Notes (from email thread)

| Issue | Status | Action |
|-------|--------|--------|
| Currency stored as TEXT | Known | Handle in transformation |
| Date format inconsistent | Being fixed | Target: DD MMM YYYY |
| Old quotes (before 01 JAN 2025) | Being closed | Filter out Waiting/Quotation status |
| Empty cells exist | Known | Handle null values |
| ~12,411 quotations | Confirmed | Large dataset |

---

## 9. Dashboard URLs (Production)

- **Supplier Marketplace:** https://sajeshvs.github.io/MVLPowerBI/supplier-marketplace.html
- **Global Spend Analysis:** https://sajeshvs.github.io/MVLPowerBI/global-spend-analysis.html
- **Disciplines Consolidated:** https://sajeshvs.github.io/MVLPowerBI/disciplines-consolidated.html

---

*Document maintained for data integration reference*
