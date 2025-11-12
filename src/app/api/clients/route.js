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

export async function GET() {
    await connectDB();
    const clients = await InstallmentModel.find().sort({ createdAt: -1 });
    return NextResponse.json(clients);
}

export async function POST(req) {
    await connectDB();
    const data = await req.json();

    try {
        const client = await InstallmentModel.create(data);

        let paymentInfo = "";
        if (client.remainingAmount === 0) {
            paymentInfo = "💵 Оплата произведена полностью";
        } else if (client.installmentTerm && client.installmentTerm > 1) {
            paymentInfo = `📆 Рассрочка на ${client.installmentTerm} мес.\n` +
                `💰 Первоначальный взнос: ${client.firstPaymentAmount || 0}\n` +
                `💳 Остаток: ${client.remainingAmount}`;
        } else {
            paymentInfo = `💵 Оплата наличными: ${client.payments?.[0]?.paid || client.remainingAmount}`;
        }

        const message = `<b>Новый клиент добавлен</b>\n` +
            `Имя: ${client.name}\n` +
            `Телефон: ${client.phoneNumber}\n` +
            `Дата создания: ${client.createdAt.toISOString()}\n` +
            `${paymentInfo}`;

        await sendTelegramMessage(message);

        return NextResponse.json(client, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
