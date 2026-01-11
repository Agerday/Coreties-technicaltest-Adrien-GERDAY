import {useEffect, useState} from "react";
import {Company} from "@/types/company";

interface CompanyDetailProps {
    companyName: string;
}

export default function CompanyDetail({companyName}: CompanyDetailProps) {
    const [detail, setDetail] = useState<Company | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!companyName) {
            setDetail(null);
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        setLoading(true);

        fetch(`/api/companies/${encodeURIComponent(companyName)}`, {
            signal: controller.signal,
        })
            .then(res => (res.ok ? res.json() : null))
            .then(setDetail)
            .catch(() => {
                if (!controller.signal.aborted) {
                    setDetail(null);
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [companyName]);

    if (!companyName) {
        return (
            <div className="p-6 text-center text-zinc-500 dark:text-zinc-400">
                Select a company to view details
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-6 text-center text-zinc-500 dark:text-zinc-400">
                Loading...
            </div>
        );
    }

    if (!detail) {
        return (
            <div className="p-6 text-center text-zinc-500 dark:text-zinc-400">
                Company not found
            </div>
        );
    }

    return (
        <div className="p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-1">
                {detail.name}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                {detail.country}
            </p>
            <a
                href={detail.website}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-6 block"
            >
                {detail.website}
            </a>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                        {detail.totalShipments}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Shipments</p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                        {(detail.totalWeight / 1000).toFixed(1)}k
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">kg Total</p>
                </div>
            </div>

            {/* Top Trading Partners */}
            <div className="mb-6">
                <h3 className="text-sm font-medium underline text-zinc-900 dark:text-zinc-50 mb-3">
                    Top Trading Partners
                </h3>
                <div className="space-y-2">
                    {detail.topTradingPartners.map((partner, idx) => (
                        <div
                            key={idx}
                            className="flex items-center justify-between text-sm"
                        >
                            <div>
                <span className="text-zinc-900 dark:text-zinc-50">
                  {partner.name}
                </span>
                                <span className="text-zinc-400 dark:text-zinc-500 ml-2">
                  {partner.country}
                </span>
                            </div>
                            <span className="text-zinc-600 dark:text-zinc-400">
                {partner.shipments}
              </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Commodities */}
            <div>
                <h3 className="text-sm font-medium underline text-zinc-900 dark:text-zinc-50 mb-3">
                    Top Commodities
                </h3>
                <div className="space-y-2">
                    {detail.topCommodities.map((commodity, idx) => (
                        <div
                            key={idx}
                            className="flex items-center justify-between text-sm"
                        >
              <span className="text-zinc-900 dark:text-zinc-50">
                {commodity.name}
              </span>
                            <span className="text-zinc-600 dark:text-zinc-400">
                {(commodity.weight / 1000).toFixed(1)}k kg
              </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
