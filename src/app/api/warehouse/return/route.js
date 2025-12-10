// /api/warehouse/return/route.js

import { NextResponse } from "next/server";
import { warehouseModel } from "../../../../lib/models/warehouse";
import { connectDB } from "../../../../lib/db";

export async function POST(req) {
    await connectDB();
    const { id } = await req.json();

    await warehouseModel.findByIdAndUpdate(id, {
        duty: false,
        "dutyDetail.returnDate": new Date(),
    });

    return NextResponse.json({ success: true });
}
