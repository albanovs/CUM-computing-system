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

export async function POST(req, { params }) {
    await connectDB();

    const { id } = await params;
    const { payments, remainingAmount } = await req.json();

    if (!Array.isArray(payments)) {
        return NextResponse.json({ error: "Поле payments должно быть массивом" }, { status: 400 });
    }

    const client = await InstallmentModel.findById(id);
    if (!client) {
        return NextResponse.json({ error: "Клиент не найден" }, { status: 404 });
    }

    for (const p of payments) {
        if (typeof p.plan !== "number" || isNaN(p.plan)) {
            return NextResponse.json({ error: "Каждый платеж должен содержать корректное число в поле plan" }, { status: 400 });
        }
        if (typeof p.paid !== "number" || isNaN(p.paid)) {
            return NextResponse.json({ error: "Каждый платеж должен содержать корректное число в поле paid" }, { status: 400 });
        }
    }

    client.payments = payments;
    client.remainingAmount = Number(remainingAmount) || 0;
    await client.save();

    const paidPayments = payments.filter(p => p.paid > 0);
    if (paidPayments.length > 0) {
        let message = `<b>Клиент внёс оплату</b>\n`;
        message += `Имя: ${client.name}\nТелефон: ${client.phoneNumber}\n`;
        message += `<b>Платежи:</b>\n`;
        paidPayments.forEach(p => {
            const date = new Date(p.plan_date).toLocaleDateString("ru-RU");
            const overdue = p.overdueDays > 0 ? ` (Просрочка: ${p.overdueDays} дн.)` : '';
            message += `Дата: ${date}, План: ${p.plan} сом, Оплачено: ${p.paid} сом${overdue}\n`;
        });

        message += `\nОстаток: ${client.remainingAmount} сом\n`;

        await sendTelegramMessage(message);
    }

    return NextResponse.json(client);
}
