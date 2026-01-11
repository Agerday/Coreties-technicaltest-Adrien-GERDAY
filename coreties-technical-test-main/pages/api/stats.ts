import type {NextApiRequest, NextApiResponse} from "next";
import {getCompanyStats, getMonthlyVolume, getTopCommodities} from "@/lib/data/shipments";
import {CompanyStats, MonthlyVolume, TopCommodity} from "@/types/company";

interface StatsResponse {
    companyStats: CompanyStats;
    topCommodities: TopCommodity[];
    monthlyVolume: MonthlyVolume[];
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<StatsResponse | { error: string }>
) {
    if (req.method !== "GET") {
        res.status(405).end();
        return;
    }

    try {
        const [companyStats, topCommodities, monthlyVolume] = await Promise.all([
            getCompanyStats(),
            getTopCommodities(),
            getMonthlyVolume(),
        ]);

        res.status(200).json({
            companyStats,
            topCommodities,
            monthlyVolume,
        });
    } catch (error) {
        console.error("Stats API error:", error);
        res.status(500).json({error: "Failed to load stats"});
    }
}
