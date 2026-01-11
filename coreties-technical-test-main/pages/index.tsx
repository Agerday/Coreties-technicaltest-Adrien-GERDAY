import { useState, useEffect, useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Shipment } from "@/types/shipment";
import Navigation from "@/components/Navigation";

const PAGE_SIZE = 50;

export default function Home() {
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [total, setTotal] = useState(0);
    const [error, setError] = useState<Error | null>(null);

    const loadingRef = useRef(false);
    const hasMoreRef = useRef(true);
    const offsetRef = useRef(0);
    const abortControllerRef = useRef<AbortController | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const loadMore = useCallback(async () => {
        if (loadingRef.current || !hasMoreRef.current) return;

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        loadingRef.current = true;
        setError(null);

        try {
            const offset = offsetRef.current;
            const res = await fetch(
                `/api/shipments?limit=${PAGE_SIZE}&offset=${offset}`,
                { signal: abortControllerRef.current.signal }
            );

            if (!res.ok) throw new Error("Failed to fetch shipments");

            const data = await res.json();

            setShipments(prev => {
                const next = [...prev, ...data.data];
                offsetRef.current = next.length;
                hasMoreRef.current = next.length < data.total;
                setTotal(data.total);
                return next;
            });
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                return;
            }
            setError(err instanceof Error ? err : new Error("Unknown error"));
        } finally {
            loadingRef.current = false;
        }
    }, []);

    useEffect(() => {
        offsetRef.current = 0;
        hasMoreRef.current = true;
        loadingRef.current = false;
        setShipments([]);
        loadMore();
    }, [loadMore]);

    //Make reusable component for table with virtual scrolling.
    const rowVirtualizer = useVirtualizer({
        count: shipments.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => 57,
        overscan: 10,
    });

    useEffect(() => {
        const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();

        if (!lastItem) return;

        if (
            lastItem.index >= shipments.length - 1 &&
            hasMoreRef.current &&
            !loadingRef.current
        ) {
            loadMore();
        }
    }, [rowVirtualizer.getVirtualItems(), shipments.length, loadMore]);

    if (shipments.length === 0 && loadingRef.current) {
        return (
            <>
                <Navigation />
                <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
                    <div className="max-w-7xl mx-auto">
                        <p className="text-zinc-600 dark:text-zinc-400">Loading shipments...</p>
                    </div>
                </div>
            </>
        );
    }

    if (error && shipments.length === 0) {
        return (
            <>
                <Navigation />
                <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
                    <div className="max-w-7xl mx-auto">
                        <p className="text-red-600 dark:text-red-400">Error: {error.message}</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navigation />
            <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">
                        Shipments
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-8">
                        Showing {shipments.length.toLocaleString()} of {total.toLocaleString()} shipments
                    </p>

                    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow overflow-hidden">
                        <div className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800">
                            <div className="grid grid-cols-7 gap-4 px-6 py-3">
                                <div className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                    ID
                                </div>
                                <div className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                    Importer
                                </div>
                                <div className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                    Country
                                </div>
                                <div className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                    Exporter
                                </div>
                                <div className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                    Date
                                </div>
                                <div className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                    Commodity
                                </div>
                                <div className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                    Weight (MT)
                                </div>
                            </div>
                        </div>

                        <div
                            ref={scrollRef}
                            className="overflow-auto max-h-[70vh]"
                        >
                            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>

                                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                    const shipment = shipments[virtualRow.index];
                                    return (
                                        <div
                                            key={virtualRow.key}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: `${virtualRow.size}px`,
                                                transform: `translateY(${virtualRow.start}px)`,
                                            }}
                                            className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                        >
                                            <div className="grid grid-cols-7 gap-4 px-6 py-4">
                                                <div className="text-sm text-zinc-900 dark:text-zinc-100 truncate">
                                                    {shipment.id}
                                                </div>
                                                <div className="text-sm text-zinc-900 dark:text-zinc-100 truncate">
                                                    {shipment.importer_name}
                                                </div>
                                                <div className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                                                    {shipment.importer_country}
                                                </div>
                                                <div className="text-sm text-zinc-900 dark:text-zinc-100 truncate">
                                                    {shipment.exporter_name}
                                                </div>
                                                <div className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                                                    {new Date(shipment.shipment_date).toLocaleDateString()}
                                                </div>
                                                <div className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                                                    {shipment.commodity_name}
                                                </div>
                                                <div className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                                                    {shipment.weight_metric_tonnes}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {loadingRef.current && (
                            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700 text-center">
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading more...</p>
                            </div>
                        )}

                        {!hasMoreRef.current && shipments.length > 0 && (
                            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700 text-center">
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                    All {total.toLocaleString()} shipments loaded
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}