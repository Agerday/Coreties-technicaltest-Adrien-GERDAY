# Full-Stack Technical Assessment

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Your Tasks

Transform shipment data into company analytics. The `/companies` page has scaffolded UI with fake data - wire it up with real SQL queries.

### Checklist

- [X] Define `Company` interface in [`types/company.ts`](types/company.ts)
- [X] Implement `transformShipmentsToCompanies()` in [`lib/data/shipments.ts`](lib/data/shipments.ts) using SQL
- [X] Create API endpoint(s) in `pages/api/`
- [X] Wire up "Total Companies" card (count importers/exporters)
- [X] Wire up "Top 5 Commodities" card (aggregate by weight)
- [X] Wire up "Monthly Volume" chart (kg per month)
- [X] Display company list table with real aggregated data
- [X] Implement company detail panel (loads when clicking a company)

---

## What We're Evaluating

- **SQL** - aggregations, GROUP BY, filtering, date functions
- **Full-stack integration** - API design, data flow, frontend state
- **Domain modeling** - how you structure the Company type
- **Code clarity** - readable, maintainable code

---

## Supplemental Material

### About the Data

~5,000 shipment records in [`data/shipments.json`](data/shipments.json):

```ts
interface Shipment {
  id: string;
  importer_name: string;
  importer_country: string;
  importer_website: string;
  exporter_name: string;
  exporter_country: string;
  exporter_website: string;
  shipment_date: string;        // ISO-8601
  commodity_name: string;
  industry_sector: string;
  weight_metric_tonnes: number;
}
```

### SQL Reference

Data is pre-loaded into a `shipments` table. Use the `query()` helper:

```ts
import { query } from "@/lib/data/shipments";

const results = await query<{ name: string; total: number }>(`
  SELECT importer_name as name, COUNT(*) as total
  FROM shipments
  GROUP BY importer_name
`);
```

DuckDB date functions: [duckdb.org/docs/sql/functions/date](https://duckdb.org/docs/sql/functions/date)

### Context

[Coreties](https://www.coreties.com/) analyzes shipment customs data. A "shipment" = goods moving from an exporter (seller) to an importer (buyer) across countries.

### What Was Implemented

1. **Company Model + Related Models**
    - Company, TradingPartner, Commodity, CompanyStats, TopCommodity, MonthlyVolume

2. **Database Queries (SQL with DuckDB)**

   **`transformShipmentsToCompanies()`**
    * Aggregates shipments into company records
    * Groups by company name, country, website
    * Calculates total shipments and weight
    * Orders by shipment count DESC

   **`getCompanyStats()`**
    * Counts distinct importers and exporters
    * Returns dashboard statistics

   **`getTopCommodities()`**
    * Aggregates commodities by total weight
    * Returns top 5 (configurable)
    * Orders by weight DESC

   **`getMonthlyVolume()`**
    * Groups shipments by month
    * Last 6 months of data (configurable)
    * Uses `strftime()` for date formatting
    * Returns chronological order

   **`getCompanyDetail()`**
    * Fetches complete company information
    * Top 3 trading partners (by shipment count)
    * Top 3 commodities (by weight)
    * SQL injection protection via quote escaping

3. **API Endpoints**
    * `GET /api/companies/companies` - List all companies
    * `GET /api/companies/[name]` - Company detail
    * `GET /api/stats` - Dashboard statistics

4. **Wired Real Data to UI**
    - Companies dashboard with live SQL data

5. **Virtual Scrolling (Production-Ready)**
    * Uses `@tanstack/react-virtual`
    * Infinite scroll - Loads 50 rows at a time
    * AbortController - Cancels stale requests
    * Ref-based state - Stable callbacks (`loadingRef`, `hasMoreRef`, `offsetRef`)
    * Performance - Renders only ~20 visible rows instead of 5000

6. **Testing with Vitest**
    * 6 critical tests covering SQL, API, and security
    * SQL injection protection validated
    * HTTP method validation