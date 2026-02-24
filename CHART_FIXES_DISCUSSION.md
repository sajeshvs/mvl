# Chart Visibility & Layout Fixes — Discussion Log

## Context
V8 unified dashboard with 3-column grid layout on the SM (Supplier Marketplace) tab.  
Charts: Entity Comparison (left), Material Distribution + Quotation to PO Time (center), Supplier Profile + Employees (right).

---

## Issue 1: Entity Comparison Chart — Bars Too Small
**Reported:** Entity chart had MACRO at $166M dominating, making all other entities (<$7M) invisible at fixed 180px height.

**First Fix Attempt:**
- Dynamic height: 40px × entity count = 760px for 19 entities
- Value labels on bars for readability
- Result: **Broke 3-column grid layout** — left column pushed everything down

**Second Fix Attempt:**
- `max-height: 300px` with `overflow-y: auto` scroll container
- `responsive: false` with explicit canvas dimensions
- Result: **X-axis labels ($0, $20M…) scrolled away** — hidden at bottom of scroll area

**Third Fix Attempt:**
- Switched to `responsive: true` with fixed 500px container height, no scroll
- Chart.js auto-fits all elements including axes
- Result: **Center/right columns had massive blank space** stretching to match 500px left column

**Fourth Fix (Current — Partial):**
- Reduced to `max-height: 300px` with scroll, `responsive: false`, 28px per entity
- Bars nicely sized, value labels visible
- **Remaining issue:** X-axis cost labels still scroll away when navigating entities

---

## Issue 2: Entity Chart X-Axis — Frozen/Sticky Requirement
**Problem:** When scrolling through entities in the 300px container, the bottom x-axis ($0.00, $20.00M, $40.00M…) disappears. User needs these always visible for reference.

**Solution:** Split into two sections:
1. **Scrollable chart area** (max-height 270px) — bars + y-axis labels, x-axis hidden
2. **Fixed axis bar** (30px) — separate canvas showing only the x-axis scale, always visible at bottom

The axis canvas aligns with the main chart's left padding (matching y-axis label width) so tick marks line up perfectly.

---

## Issue 3: Quotation to PO Time — Blank Space Below Chart
**Reported:** Chart uses only ~60% of its 260px container height, leaving visible blank space below the bars.

**Solution:** Reduce container height from 260px to 200px so chart content fills the frame snugly. Keep `responsive: true` so Chart.js auto-fits within the smaller container.

---

## Issue 4: General Layout Principle
**User directive:** "Keep that frame in fixed width so it doesn't change anything else… similarly to other"

**Approach applied to all charts:**
- Fixed container dimensions (height/width) per chart type
- Charts with many items use scroll + frozen axes where needed
- `responsive: true` / `maintainAspectRatio: false` for auto-fitting charts
- `responsive: false` only when dynamic canvas sizing is needed (scrollable charts)

| Chart | Container | Scroll | Approach |
|-------|-----------|--------|----------|
| Entity Comparison | 300px (270 scroll + 30 axis) | Vertical | `responsive: false`, frozen x-axis |
| Material Distribution | 250px fixed | None | `responsive: true` |
| Quotation to PO Time | 200px fixed | None | `responsive: true` |
| Location Map | 280px fixed | None | Leaflet.js |
| Monthly Trend | 220px fixed | None | `responsive: true` |
| Top 10 Suppliers | 420px max | Vertical | HTML list |
| Employee List | 420px max | Vertical | HTML list |

---

## Commits
| Hash | Description |
|------|-------------|
| `bb2e8fa` | First attempt: dynamic heights + value labels |
| `016891f` | Second attempt: max-height + scroll containers |
| `512fda9` | Third attempt: fixed heights + responsive:true |
| `ac6810a` | Fourth: 300px scroll entity, 260px quotation |
| *(next)* | Frozen x-axis on entity, reduce quotation blank space |
