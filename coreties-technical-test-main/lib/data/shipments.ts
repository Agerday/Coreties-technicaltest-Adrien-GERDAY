import path from "path";
import {DuckDBInstance} from "@duckdb/node-api";
import {Shipment} from "@/types/shipment";
import {Company, CompanyStats, MonthlyVolume, TopCommodity} from "@/types/company";

let instance: DuckDBInstance | null = null;
let tableInitialized = false;

async function getInstance(): Promise<DuckDBInstance> {
    if (!instance) {
        instance = await DuckDBInstance.create(":memory:");
    }
    return instance;
}

/**
 * Loads shipment data with pagination.
 */
export async function loadShipments(options?: {
    limit?: number;
    offset?: number;
}): Promise<{ data: Shipment[]; total: number }> {
    const limit = options?.limit ?? 100;
    const offset = options?.offset ?? 0;

    const countResult = await query<{ total: number }>(
        `SELECT COUNT(*) as total
         FROM shipments`
    );
    const total = countResult[0]?.total ?? 0;

    const data = await query<Shipment>(`
        SELECT *
        FROM shipments
        ORDER BY shipment_date DESC
        LIMIT ${limit} OFFSET ${offset}
    `);

    return {data, total};
}

/**
 * TODO: Implement this function using SQL.
 *
 * Transform shipment data into company-level aggregates.
 * Your SQL should match the Company interface you define in types/company.ts
 */
export async function transformShipmentsToCompanies(): Promise<Company[]> {
    const companies = await query<{
        name: string;
        country: string;
        website: string;
        totalShipments: number;
        totalWeight: number;
    }>(`
        SELECT
            importer_name AS name,
            importer_country AS country,
            importer_website AS website,
            COUNT(*)::INTEGER AS totalShipments,
            CAST(SUM(weight_metric_tonnes * 1000) AS INTEGER) AS totalWeight
        FROM shipments
        GROUP BY importer_name, importer_country, importer_website
        ORDER BY totalWeight DESC
    `);

    return companies.map((company) => ({
        ...company,
        type: "importer",
        topTradingPartners: [],
        topCommodities: [],
    }));
}

export async function getCompanyStats(): Promise<CompanyStats> {
    const [stats] = await query<CompanyStats>(`
        SELECT
            COUNT(DISTINCT importer_name)::INTEGER AS totalImporters,
            COUNT(DISTINCT exporter_name)::INTEGER AS totalExporters
        FROM shipments
  `);

    return stats;
}

export async function getTopCommodities(limit: number = 5): Promise<TopCommodity[]> {
    return query<TopCommodity>(`
        SELECT commodity_name            AS commodity,
               SUM(weight_metric_tonnes) AS kg
        FROM shipments
        GROUP BY commodity_name
        ORDER BY kg DESC
        LIMIT ${limit}
    `);
}

export async function getMonthlyVolume(months: number = 6): Promise<MonthlyVolume[]> {
    const result = await query<{
        year_month: string;
        month: string;
        kg: number;
    }>(`
    SELECT 
      strftime(shipment_date, '%Y-%m') as year_month,
      strftime(shipment_date, '%b %Y') as month,
      CAST(SUM(weight_metric_tonnes * 1000) as INTEGER) as kg
    FROM shipments
    GROUP BY year_month, month
    ORDER BY year_month desc
    LIMIT ${months}
  `);

    return result.reverse().map(r => ({
        month: r.month,
        kg: r.kg
    }));
}

export async function getCompanyDetail(companyName: string): Promise<Company | null> {
    const escapedName = companyName.replace(/'/g, "''");

    const baseInfo = await query<{
        name: string;
        country: string;
        website: string;
        totalShipments: number;
        totalWeight: number;
    }>(`
        SELECT
            importer_name as name,
            importer_country as country,
            importer_website as website,
            COUNT(*) as totalShipments,
            CAST(SUM(weight_metric_tonnes * 1000) as INTEGER) as totalWeight
        FROM shipments
        WHERE importer_name = '${escapedName}'
        GROUP BY importer_name, importer_country, importer_website
    `);

    if (baseInfo.length === 0) {
        return null;
    }

    const topPartners = await query<{
        name: string;
        country: string;
        shipments: number;
    }>(`
    SELECT 
      exporter_name as name,
      exporter_country as country,
      COUNT(*) as shipments
    FROM shipments
    WHERE importer_name = '${escapedName}'
    GROUP BY exporter_name, exporter_country
    ORDER BY shipments DESC
    LIMIT 3
  `);

    const topCommodities = await query<{
        name: string;
        weight: number;
    }>(`
    SELECT 
      commodity_name as name,
      CAST(SUM(weight_metric_tonnes * 1000) as INTEGER) as weight
    FROM shipments
    WHERE importer_name = '${escapedName}'
    GROUP BY commodity_name
    ORDER BY weight DESC
    LIMIT 3
  `);

    return {
        ...baseInfo[0],
        type: 'importer',
        topTradingPartners: topPartners,
        topCommodities: topCommodities,
    };
}


/**
 * Initializes the `shipments` table from JSON data.
 * This is called automatically before queries, so you can simply write:
 *
 * ```sql
 * SELECT * FROM shipments
 * ```
 */
async function ensureTableInitialized(): Promise<void> {
    if (tableInitialized) return;

    const db = await getInstance();
    const connection = await db.connect();
    const filePath = path.join(process.cwd(), "data", "shipments.json");

    await connection.run(`
        CREATE TABLE IF NOT EXISTS shipments AS
        SELECT *
        FROM read_json_auto('${filePath}')
    `);

    connection.closeSync();
    tableInitialized = true;
}

/**
 * Execute a SQL query and return the results as an array of objects.
 * The `shipments` table is automatically available — no need for read_json_auto.
 *
 * Example usage:
 * ```ts
 * const results = await query<{ name: string; total: number }>(`
 *   SELECT importer_name as name, COUNT(*) as total
 *   FROM shipments
 *   GROUP BY importer_name
 * `);
 * ```
 */
export async function query<T>(sql: string): Promise<T[]> {
    await ensureTableInitialized();

    const db = await getInstance();
    const connection = await db.connect();

    const reader = await connection.runAndReadAll(sql);
    const rows = reader.getRowObjectsJson();
    connection.closeSync();

    return rows as unknown as T[];
}
