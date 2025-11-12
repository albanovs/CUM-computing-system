import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { InstallmentModel } from "@/lib/models/all_data";

const TELEGRAM_BOT_TOKEN = '8396661511:AAHXdQYMm_NPAN1hbFw2Owmn6kgsJ6_j2T0';
const TELEGRAM_CHAT_ID = '-4938428460';

async function sendTelegramMessage(message) {
    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: "HTML"
            })
        });
    } catch (err) {
        console.error("Ошибка отправки сообщения в Telegram:", err);
    }
}

export async function GET(_, { params }) {
    await connectDB();
    const client = await InstallmentModel.findById(params.id);
    if (!client) return NextResponse.json({ error: "Клиент не найден" }, { status: 404 });
    return NextResponse.json(client);
}

export async function PATCH(req, { params }) {
    await connectDB();
    const data = await req.json();

    try {
        const updated = await InstallmentModel.findByIdAndUpdate(params.id, data, { new: true });
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function DELETE(_, { params }) {
    await connectDB();
    const { id } = await params;

    try {
        const client = await InstallmentModel.findById(id);
        if (!client) return NextResponse.json({ error: "Клиент не найден" }, { status: 404 });

        const message = `<b>Клиент удалён</b>\n` +
            `Имя: ${client.name}\n` +
            `Телефон: ${client.phoneNumber}\n` +
            `Модель телефона: ${client.phoneModel}\n` +
            `Остаток: ${client.remainingAmount || 0} сом\n` +
            `Дата создания: ${client.createdAt.toISOString()}`;
        await sendTelegramMessage(message);

        await InstallmentModel.findByIdAndDelete(id);

        return NextResponse.json({ message: "Клиент удалён" });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
