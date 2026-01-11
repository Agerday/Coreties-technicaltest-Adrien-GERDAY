import { describe, it, expect } from 'vitest';
import {
    transformShipmentsToCompanies,
    getCompanyStats,
    getCompanyDetail,
} from '../shipments';

describe('Critical Data Layer Tests', () => {
    it('should transform shipments to companies correctly', async () => {
        const companies = await transformShipmentsToCompanies();

        expect(companies.length).toBeGreaterThan(0);
        expect(companies[0]).toHaveProperty('name');
        expect(companies[0]).toHaveProperty('totalShipments');
        expect(companies[0].totalShipments).toBeGreaterThan(0);
    });

    it('should get company stats', async () => {
        const stats = await getCompanyStats();

        expect(stats.totalImporters).toBeGreaterThan(0);
        expect(stats.totalExporters).toBeGreaterThan(0);
    });

    it('should get company detail with trading partners', async () => {
        const companies = await transformShipmentsToCompanies();
        const detail = await getCompanyDetail(companies[0].name);

        expect(detail).not.toBeNull();
        expect(detail?.topTradingPartners).toBeDefined();
        expect(detail?.topCommodities).toBeDefined();
    });

    it('should handle SQL injection safely', async () => {
        const maliciousInput = "'; DROP TABLE shipments; --";
        const detail = await getCompanyDetail(maliciousInput);

        expect(detail).toBeNull();
    });
});