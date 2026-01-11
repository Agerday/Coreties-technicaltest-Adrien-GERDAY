import { describe, it, expect, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '../companies/companies';

describe('Critical API Tests', () => {
    it('should return companies array', async () => {
        const req = { method: 'GET' } as NextApiRequest;
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        } as unknown as NextApiResponse;

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const companies = (res.json as any).mock.calls[0][0];
        expect(Array.isArray(companies)).toBe(true);
    });

    it('should reject non-GET methods', async () => {
        const req = { method: 'POST' } as NextApiRequest;
        const res = {
            status: vi.fn().mockReturnThis(),
            end: vi.fn(),
        } as unknown as NextApiResponse;

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(405);
    });
});