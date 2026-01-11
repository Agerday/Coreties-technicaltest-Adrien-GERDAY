import type {NextApiRequest, NextApiResponse} from "next";
import {loadShipments} from "@/lib/data/shipments";
import {Shipment} from "@/types/shipment";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<{ data: Shipment[]; total: number }>
) {
    if (req.method !== "GET") {
        res.status(405).end();
        return;
    }


    //Fix the "showing 5k shipments out of 4996 shipments" bug
    const limit = Number(req.query.limit) || 100;
    const offset = Number(req.query.offset) || 0;

    const result = await loadShipments({limit, offset});
    res.status(200).json(result);
}
