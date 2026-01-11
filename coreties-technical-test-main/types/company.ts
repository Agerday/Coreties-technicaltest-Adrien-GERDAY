export interface Company {
    name: string;
    country: string;
    website: string;
    type: 'importer' | 'exporter';
    totalShipments: number;
    totalWeight: number;
    topTradingPartners: TradingPartner[];
    topCommodities: Commodity[];
}

export interface TradingPartner {
    name: string;
    country: string;
    shipments: number;
}

export interface Commodity {
    name: string;
    weight: number;
}

export interface CompanyStats {
    totalImporters: number;
    totalExporters: number;
}

export interface TopCommodity {
    commodity: string;
    kg: number;
}

export interface MonthlyVolume {
    month: string;
    kg: number;
}