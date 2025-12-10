import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import { warehouseModel } from "../../../../lib/models/warehouse";

export async function GET(req, { params }) {
    try {
        await connectDB();

        const item = await warehouseModel.findById(params.id);

        if (!item) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        return NextResponse.json(item);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req, context) {
    try {
        await connectDB();
        const params = await context.params;
        const { id } = params;

        if (!id) {
            return NextResponse.json({ error: "ID не указан" }, { status: 400 });
        }
        const data = await req.json();

        const updated = await warehouseModel.findByIdAndUpdate(
            id,
            data,
            { new: true }
        );

        if (!updated)
            return NextResponse.json({ error: "Not found" }, { status: 404 });

        return NextResponse.json(updated);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req, context) {
    try {
        await connectDB();

        const params = await context.params;
        const { id } = params;

        if (!id) {
            return NextResponse.json({ error: "ID не указан" }, { status: 400 });
        }

        const deleted = await warehouseModel.findByIdAndDelete(id);

        if (!deleted) {
            return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

