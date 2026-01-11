import {useEffect, useRef, useState} from "react";
import Navigation from "@/components/Navigation";
import CompanyDetail from "@/components/CompanyDetail";
import {Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,} from "recharts";
import {Company, CompanyStats, MonthlyVolume, TopCommodity} from "@/types/company";
import {useVirtualizer} from "@tanstack/react-virtual";

export default function CompaniesPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<string>('');
    const [stats, setStats] = useState<CompanyStats | null>(null);
    const [topCommodities, setTopCommodities] = useState<TopCommodity[]>([]);
    const [monthlyVolume, setMonthlyVolume] = useState<MonthlyVolume[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const hasStats = stats !== null;
    const hasTopCommodities = topCommodities.length > 0;
    const hasMonthlyVolume = monthlyVolume.length > 0;
    const hasCompanies = companies.length > 0;
    const hasSelectedCompany = selectedCompany !== "";
    const scrollRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: companies.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => 57,
        overscan: 5,
    });

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError(null);

            try {
                const [companiesRes, statsRes] = await Promise.all([
                    fetch("/api/companies/companies"),
                    fetch("/api/stats"),
                ]);

                if (!companiesRes.ok || !statsRes.ok) {
                    throw new Error("Failed to fetch data");
                }

                const companies = await companiesRes.json();
                const stats = await statsRes.json();

                if (cancelled) return;

                setCompanies(companies);
                setStats(stats.companyStats);
                setTopCommodities(stats.topCommodities);
                setMonthlyVolume(stats.monthlyVolume);
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "Failed to load data");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return (
            <>
                <Navigation/>
                <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-center min-h-[400px]">
                            <div className="text-center">
                                <div
                                    className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
                                <p className="text-zinc-500 dark:text-zinc-400">Loading companies data...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Navigation/>
                <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-center min-h-[400px]">
                            <div className="text-center">
                                <p className="text-red-600 dark:text-red-400 mb-4">Error: {error}</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navigation/>
            <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-8">
                        Companies Overview
                    </h1>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Total Companies Card */}
                        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6">
                            <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">
                                Total Companies
                            </h2>
                            {hasStats ? (

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                                                {stats.totalImporters.toLocaleString()}
                                            </p>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                                                Importers
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                                                {stats.totalExporters.toLocaleString()}
                                            </p>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                                                Exporters
                                            </p>
                                        </div>
                                    </div>
                                )
                                : (
                                    <p className="text-sm text-zinc-500">Loading stats…</p>
                                )}
                        </div>

                        {/* Top Commodities Card */}
                        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6">
                            <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">
                                Top 5 Commodities by Weight
                            </h2>
                            {hasTopCommodities ? (
                                <>
                                    <div className="space-y-3">
                                        {topCommodities.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                <span
                                                    className="text-lg font-semibold text-zinc-400 dark:text-zinc-600">
                                                    {idx + 1}
                                                </span>
                                                    <span className="text-sm text-zinc-900 dark:text-zinc-50">
                                                    {item.commodity}
                                                </span>
                                                </div>
                                                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                                {(item.kg / 1000).toFixed(0)}k kg
                                            </span>
                                            </div>
                                        ))}
                                    </div>
                                </>) : (
                                <p className="text-sm text-zinc-500">No commodity data</p>
                            )}
                        </div>
                    </div>

                    {/* Monthly KG Chart */
                    }
                    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 mb-8">
                        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-6">
                            Total Weight Shipped per Month (kg)
                        </h2>
                        <div className="h-64">
                            {hasMonthlyVolume ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={monthlyVolume}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a"/>
                                        <XAxis
                                            dataKey="month"
                                            stroke="#71717a"
                                            style={{fontSize: "12px"}}
                                        />
                                        <YAxis
                                            stroke="#71717a"
                                            style={{fontSize: "12px"}}
                                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "#18181b",
                                                border: "1px solid #27272a",
                                                borderRadius: "6px",
                                                color: "#fafafa",
                                            }}
                                            formatter={(value) => [
                                                `${Number(value).toLocaleString()} kg`,
                                                "Weight",
                                            ]}
                                        />
                                        <Bar dataKey="kg" fill="#3b82f6" radius={[4, 4, 0, 0]}/>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                                    No monthly data available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Master-Detail: Company List + Detail Panel */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Company List (Left/Main) */}
                        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-lg shadow">
                            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                                    Company List
                                </h2>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                    Click a company to view details
                                </p>
                            </div>

                            {hasCompanies ? (
                            <div
                                ref={scrollRef}
                                className="overflow-auto max-h-[500px]"
                            >
                                <div style={{height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative'}}>
                                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                        const company = companies[virtualRow.index];
                                        return (
                                            <div
                                                key={company.name}
                                                style={{
                                                    position: "absolute",
                                                    top: 0,
                                                    left: 0,
                                                    width: "100%",
                                                    height: `${virtualRow.size}px`,
                                                    transform: `translateY(${virtualRow.start}px)`,
                                                }}
                                                className={`grid grid-cols-4 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 cursor-pointer ${
                                                    selectedCompany === company.name
                                                        ? "bg-blue-50 dark:bg-blue-900/20"
                                                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                                                }`}
                                                onClick={() => setSelectedCompany(company.name)}
                                            >
                                                <div className="text-sm text-zinc-900 dark:text-zinc-50 truncate">
                                                    {company.name}
                                                </div>
                                                <div className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                                                    {company.country}
                                                </div>
                                                <div className="text-sm text-zinc-900 dark:text-zinc-50 text-right">
                                                    {company.totalShipments.toLocaleString()}
                                                </div>
                                                <div className="text-sm text-zinc-600 dark:text-zinc-400 text-right">
                                                    {company.totalWeight.toLocaleString()} kg
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            ) : (
                            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                                No companies data available
                            </div>
                            )}
                        </div>

                        {/* Company Detail Panel (Right) */}
                        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow">
                            {hasSelectedCompany ? (
                                <CompanyDetail companyName={selectedCompany}/>
                            ) : (
                                <div className="p-6 text-center text-sm text-zinc-500">
                                    Select a company to view details
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
        ;
}
