import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import { warehouseModel } from "../../../lib/models/warehouse";

export async function GET() {
    try {
        await connectDB();
        const items = await warehouseModel.find().sort({ createdAt: -1 });
        return NextResponse.json(items);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await connectDB();
        const data = await req.json();

        const item = await warehouseModel.create(data);

        return NextResponse.json(item);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
