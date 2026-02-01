# MVL Supply Intel Hub — Copilot Agent Instructions

Purpose: Use these instructions to refine or extend the HTML dashboards for Power BI styling and future handoff.

## Current Production Files
- Supplier Marketplace page: html/supplier-marketplace.html
- Global Spend Analysis page: html/global-spend-analysis.html
- Consolidated Disciplines page: html/disciplines-consolidated.html

## Archive
- Previous versions moved to: html/archive/

## Design Rules (Do Not Break)
1. Keep layout width to a single-screen dashboard (16:9 or equivalent) with minimal scrolling.
2. Maintain MVL branding:
   - Supplier Marketplace: Blue gradient (#004578 to #0064a3)
   - Global Spend Analysis: Orange gradient (#d96f3c to #e8824a)
   - Disciplines: Dark blue gradient (#0f3d5e to #1a5a8a)
   - Typography: Segoe UI font family throughout
3. Preserve slicer locations and KPI order based on narratives:
   - Supplier Marketplace: header → filters → 3-column layout (Profile / Charts / Workbench).
   - GloIntegration
- All data comes from MD files in reference/ folder
- Fact tables: FactQuotationHeader, FactPOTable, FactPOLine
- Dimensions: DimDate, DimEntity, DimSupplierClient, DimProject, DimMaterial, DimCurrency, DimQuotationStatus, DimPOType
- Key DAX measures implemented as JavaScript calculations in charts
- Sample data reflects realistic procurement scenarios from 2020-2026

## Data Placeholders
- All bracketed values (e.g., [Selected Supplier Name]) are placeholders.
- Keep table structures intact; replace only the sample data rows.
- Chart areas are represented by dashed placeholders; do not remove placeholders unless replaced with SVG or images.

## Image References
- Supplier Marketplace mockup image: reference/images/Supplier_Marketplace_-_Potential_User_Interface.png
- Global Spend Analysis mockup image: reference/images/Global_Spend_Analysis_-_Potential_User_Interface.png
- Disciplines mockup currently uses no image reference.

## Instructions for Exporting PNGs
1. Open the HTML file in a browser.
2. Set zoom to 100%.
3. Use a 16:9 window size (e.g., 1366 × 768).
4. Implemented Features
- Chart.js library integration for professional interactive charts
- Status badges with proper color coding (Order=green, Waiting=yellow, Cancelled=red)
- Responsive grid layouts that adapt to different screen sizes
- Professional Power BI-style cards with shadows and proper spacing
- Hover effects on tables and interactive elements
- Emoji icons for visual hierarchy in headers and panelsals.
- Add MVL logo in the header area if supplied by the client.
- Apply Power BI theme colors to status pills (Order/Waiting/Cancelled).

## Notes from Scope of Work
- These pages represent MVP visual design only.
- Data integration and measures are handled in Power BI; HTML is for design alignment.
- Align KPI labels and filters with Section 5 of Scope of Work.
