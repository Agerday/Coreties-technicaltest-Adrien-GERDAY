import type { NextApiRequest, NextApiResponse } from "next";
import { transformShipmentsToCompanies } from "@/lib/data/shipments";
import { Company } from "@/types/company";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Company[] | { error: string }>
) {
    if (req.method !== "GET") {
        res.status(405).end();
        return;
    }

    try {
        const companies = await transformShipmentsToCompanies();
        res.status(200).json(companies);
    } catch (error) {
        console.error("Companies API error:", error);
        res.status(500).json({ error: "Failed to load companies" });
    }
}
