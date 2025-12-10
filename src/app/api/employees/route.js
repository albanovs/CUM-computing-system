import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import { employeesModel } from "../../../lib/models/employees";

export async function GET() {
  try {
    await connectDB();
    const employees = await employeesModel.find().sort({ createdAt: -1 });
    return NextResponse.json(employees);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — создать сотрудника
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const employee = await employeesModel.create(body);

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT — обновить сотрудника
export async function PUT(req) {
  try {
    await connectDB();
    const { id, ...rest } = await req.json();

    const updated = await employeesModel.findByIdAndUpdate(id, rest, {
      new: true,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE — удалить сотрудника
export async function DELETE(req) {
  try {
    await connectDB();
    const { id } = await req.json();

    await employeesModel.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
