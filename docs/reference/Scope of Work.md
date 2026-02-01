# Scope of Work

_Source: Scope of Work.docx_
_Converted: 2026-01-23_

---
MVL GROUP

Scope of Work



MVL Supplier Intel Hub





| Document Owner: | Transformation Department |
| --- | --- |
| Approver: | CTIO |
| Version: | 1.0 |
| Created: | 23-01-2026 |


## 1. Scope

This project’s scope of work is to design, build, and operationalize the MVL Supplier Intel Hub: an automated, production grade Power BI solution that pulls data daily from MVL’s in house PHP platform and delivers two executive dashboards—Supplier Marketplace and Global Spend Analysis—for construction, supply chain and procurement decision making.

## 2. Objectives

This initiative aims to :

Provide MVL executives with a single source of truth on quotations, POs, suppliers, projects, and materials.

Create a reusable cloud based data layer where PHP data is landed and modeled before Power BI, so it can later be reused by broader integration projects (other ERPs, project systems, etc.), without overloading the PHP platform.

Implement two interactive Power BI pages (Supplier Marketplace, Global Spend Analysis) with full MVL branding (colors, fonts where possible, logo, layout conventions)

## 3. Data Sources and Integration

### 3.1 Source Systems

Primary source: MVL in house PHP platform (quotation module, PO module, supplier/client directory).

Future sources (Phase 2+): other ERPs/PM tools to be integrated later into the same cloud data layer.

Optional auxiliary sources (if needed for later phases): currency/FX tables, project master data from other systems, or Excel/CSV reference lists.

### 3.2 Cloud data platform / landing zone

The vendor shall:

Propose and implement a cloud data platform architecture (e.g., Azure SQL Database / Azure Data Lake / Fabric Lakehouse, or equivalent in MVL’s chosen cloud) to act as the central landing and curated layer for PHP data and future systems.

Design at minimum three layers:

Landing/Raw: direct extracts from PHP (minimal transformation, history kept).

Staging: cleaned, typed, de duplicated tables.

Curated / Analytics: star schema tables (facts and dimensions) exposed to Power BI.

### 3.3 Data extraction (from PHP to cloud, not directly to Power BI)

The vendor shall:

Analyse the PHP platform database/schema (MySQL or equivalent) and identify all required tables and fields to support the dashboards (quotations, POs, line items, suppliers/clients, projects, materials, entities, currencies, statuses).

Design and implement ETL/ELT pipelines (via APIs, etc.) to extract incremental data at least once per day into a reporting layer or data warehouse (staging + curated area).

Connect to the PHP database/API and extract data only into the cloud landing zone, not directly to Power BI, to avoid performance impact on the live PHP application.

Implement scheduled extract jobs (e.g., every night) using an agreed technology (Azure Data Factory / Fabric Pipelines / equivalent) that:

Read from the PHP backend.

Write to the landing/raw area in the cloud.

Are incremental, restartable, and logged.

Ensure that extraction jobs are robust, logged, and can be re run without duplication.


### 3.4 Data Transformation and Modeling

The vendor shall:

Perform all heavy transformations inside the cloud data platform, not on the PHP system:

Clean, conform, and join tables into staging.

Implement the star schema (FactQuotationHeader, FactPOTable, FactPOLine, DimDate, DimEntity, DimSupplierClient, DimProject, DimMaterial, DimCurrency, DimQuotationStatus, DimPOType).

Expose curated views or tables that are optimized for Power BI to import or DirectQuery from, ensuring the same curated layer can be reused later by additional tools and integrations.

Implement business rules such as:

Quotation type (IQ vs RFQ).

Linking POs to quotations via number pattern (RFP → RFPO).

PO type (Base vs Change Order) based on PO number ending (…1 vs …2).

Status classification (Quotation, Waiting, Order, Cancelled; flags for Won/Open/Lost).

Implement currency handling and standardize to USD (or other group currency) either via FX reference tables or existing values in the PHP system.

Power BI will connect only to the curated cloud layer, never straight to PHP.

## 4. Power BI Data Model and Branding

### 4.1 Dataset / Semantic Model

The vendor shall implement a Power BI semantic model (dataset) with:

All dimension and fact tables described in Section 3.4, with relationships configured and tested.

Core DAX measures, including but not limited to:

Total Quotations, Total POs, Total Base POs, Total Change Orders.

Total Quotation Value (USD), Total PO Spend (USD), Total PO Spend (Last 6 Years).

Won Quotations, Lost Quotations, Open Quotations.

Win Rate %, Quote to PO Conversion %.

Change Order Spend (USD), Change Order Spend %, Average PO Value (USD).

Distinct Suppliers, Distinct Projects.

YTD/previous-year spend and Spend Growth %.

Additional measures required to support visuals, tooltips, rankings (Top/Bottom 10 suppliers), and drill-through pages.

All measures must be documented (description, logic, dependencies) for MVL's BI team.

### 4.2 MVL Branding

The vendor shall:

Implement a Power BI theme file (.json) that encodes MVL's colors (primary, secondary, accent), default fonts (or closest supported by Power BI), and visual styles (backgrounds, gridlines, header colors).

Apply MVL's logo and standard header layout on each page (e.g., MVL logo on left/right, standardized title/subtitle pattern, refresh time).

Ensure all visuals (cards, charts, tables, slicers) follow MVL's visual identity:

Consistent color palette for statuses (e.g., green = Order, yellow = Waiting, red = Cancelled).

Use of MVL accent colors for KPIs and key trends.

Minimal clutter and executive-grade layout aligned with the supplied mockups.

Include the theme file and layout guidelines as part of the deliverables so MVL can reuse them on other reports.

## 5. Dashboard Design and Build

### 5.1 Supplier Marketplace Page

The vendor shall build a Power BI page consistent with the agreed mockup, including:

Slicers: Entity, Supplier/Client, Quotation Type, Status, Material Type, Discipline.

Supplier Profile panel:

Supplier name, partner type, primary entity, rating, contact info (name, email, phone).

KPI cards: Quotations, POs, Win Rate.

Table: Approved Materials & Disciplines (Material Type, Discipline, Lead Time, Last Currency).

Middle visuals:

Quotation Funnel: Quotations → Waiting → Order → Cancelled (counts and values).

Combo chart: Quote to PO Timeline by month (Quotation Value, PO Value, Change Orders).

Marketplace Workbench table:

Columns: Quote/PO, Type (IQ/RFQ/PO), Status, Project, Material, Value, Currency, Contact, Age (days since quotation).

Conditional formatting for status and aging (e.g., long-open Waiting quotes).

The page should be fully interactive: selection in any visual filters the others, with intuitive drill-down/drill-through where applicable.

### 5.2 Global Spend Analysis Page

The vendor shall build a Power BI page consistent with the agreed mockup, including:

Slicers: Entity, Supplier Name, Project Name (multi-select), PO No., Year, PO Placement Date (range), Material Type, Discipline, Quotation Type, PO Type (Base/Change), Currency.

KPI cards:

Total Spend (USD).

No. of Base POs.

No. of Change Orders.

Active Suppliers (with at least one PO).

Visuals:

Annual Spend Trend chart (Base vs Change, plus running-total line) from 2000 to current year.

Donut chart for Spend by Project (with option to switch to Entity or other breakdown).

PO Details table: PO No, Project, Supplier, Entity, PO Date, Type, Material, Discipline, PO Value (USD), Currency.

Bar charts: Top 10 Suppliers by Spend; Bottom 10 Active Suppliers by Spend.

Page should support drill-through to supplier, project, or entity detail if required.

## 6. Automation, Refresh, and Extensibility

The vendor shall:

Configure two-stage scheduling:

Stage 1: cloud ETL from PHP (e.g., nightly).

Stage 2: Power BI dataset refresh from the curated cloud layer, triggered after ETL completion.

Design the cloud model so it can easily onboard new source systems later (e.g., additional fact tables for contracts, budgets, logistics), leveraging the same shared dimensions (Suppliers, Projects, Materials, Entities, Date).

Implement daily refresh of the dataset (and more frequent if technically feasible and agreed).

Implement refresh failure alerts (email to MVL admins) and basic operational dashboards for data pipeline health.

Propose and implement an environment strategy (Dev/Test/Prod) for the Power BI workspace(s).

## 7. Security and Access

Implement row-level security (RLS) if required (e.g., restricting users to their entity or region).

Configure appropriate roles and permissions in Power BI Service (admins, developers, business users, view-only).

Document how MVL can onboard/offboard users and adjust RLS going forward.

## 8. Deliverables

### 8.1 Documentation

Technical design documentation, including:

Source-to-target mappings from PHP tables to the analytics model.

ER diagrams / star schema diagram.

Data transformation rules and business logic.

Cloud data platform configuration: resource creation scripts/templates (e.g., ARM/Bicep/Terraform or equivalent) and documentation for landing/staging/curated areas.

### 8.2 Data Integration and Code

ETL/ELT pipelines implemented and scheduled in MVL's chosen technology (e.g., SQL scripts, SSIS, ADF, Fabric Dataflows/Gen2, or equivalent), ready for daily execution.

Data pipelines (PHP → cloud) with clear run-books and monitoring setup.

### 8.3 Power BI Solution

Power BI dataset (PBIX or semantic model) with all tables, relationships, and DAX measures.

2 Power BI report pages: Supplier Marketplace and Global Spend Analysis, with all visuals implemented, styled, and performance-tuned.

Deployed solution in MVL's Power BI Service workspace (Dev/Test/Prod as applicable).

MVL Power BI theme file and branding guidelines, including examples of correct visual styling.

### 8.4 Knowledge Transfer

User and admin documentation, including:

How to use each page and interpret KPIs/visuals.

How refresh and data pipelines work.

How to adjust parameters (e.g., date ranges, thresholds) and add new dimensions or measures.

Training session(s) (remote or onsite) for MVL's BI and supply chain team: walkthrough of data model, measures, and report usage.

## 9. Assumptions and Responsibilities

### 9.1 MVL Will Provide

Access to the PHP database/API and any other necessary systems.

Data dictionary or schema description where available.

Named business SMEs for validation of logic (e.g., quotation/PO numbering, change-order rules, statuses).

### 9.2 Vendor Will

Follow MVL's security and data-privacy requirements.

Use source control for all code and PBIX files and hand these over at project end.

Conduct at least one UAT cycle with MVL before production go-live.

## 10. Timeline and Acceptance Criteria

### 10.1 Project Phases

The parties will agree a detailed project plan, but major phases are expected to be:

Discovery & Design – 2 weeks

Workshops to finalize requirements, mockups, KPIs, data fields.

Review PHP schema, confirm integration pattern and cloud architecture.

Deliverables: signed-off SOW, high-level data model, page wireframes.

Cloud Data Platform & Pipelines – 3–4 weeks

Set up landing/staging/curated layers in your chosen cloud.

Build and test PHP → cloud extraction (incremental, logged).

First full historical load + data quality checks.

Data Model & DAX – 2–3 weeks

Implement star schema (facts/dimensions) in curated layer.

Build Power BI dataset, relationships, and core measures (spend, counts, win-rate, change orders, rankings).

Validate numbers against PHP for a sample of suppliers/projects.

Report Build & Branding – 2–3 weeks

Implement MVL theme, headers, and navigation.

Build Supplier Marketplace and Global Spend Analysis pages to spec.

Performance tuning (visual layout, aggregations if needed).

UAT, Training & Go-Live – 1–2 weeks

User testing, bug fixes, final reconciliation of KPIs.

Configure refresh schedules, alerts, access/security.

Handover sessions for MVL BI team and key business users.

Total estimated timeline: 10–14 weeks (subject to access availability and decision velocity).

### `

The solution will be accepted when:

Daily refresh runs successfully over an agreed burn-in period (e.g., two weeks).

Measures and visuals reconcile to agreed control totals from the PHP system for a sample of projects/suppliers.

MVL users confirm that both dashboards match the signed-off mockups and functional descriptions above.

Cloud data platform and ETL pipelines are operational and documented for future extension.

All deliverables (code, documentation, theme file, training materials) have been handed over and MVL's team is confident in maintaining the solution.

## 11. Notes

Scope boundaries: This SOW covers the MVP build (Supplier Marketplace + Global Spend Analysis). Additional dashboards, advanced analytics, or integration of other systems will be treated as separate phases.

Cloud platform flexibility: The vendor may propose Azure, AWS, or Google Cloud; MVL will confirm preferred platform before work begins.

Data retention: The cloud landing zone will retain at least 3 years of historical data; longer retention policies can be agreed.

Future extensibility: The star schema and cloud architecture are designed to simplify future onboarding of Deltek Costpoint, Vision, Procore, and other enterprise systems.
