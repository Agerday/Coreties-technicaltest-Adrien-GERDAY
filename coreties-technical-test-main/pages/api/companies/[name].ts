import type { NextApiRequest, NextApiResponse } from "next";
import { getCompanyDetail } from "@/lib/data/shipments";
import { Company } from "@/types/company";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Company | { error: string }>
) {
    if (req.method !== "GET") {
        res.status(405).end();
        return;
    }

    const { name } = req.query;

    if (typeof name !== "string") {
        res.status(400).json({ error: "Invalid company name" });
        return;
    }

    const company = await getCompanyDetail(name);

    if (!company) {
        res.status(404).json({ error: "Company not found" });
        return;
    }

    res.status(200).json(company);
}