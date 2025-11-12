import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { InstallmentModel } from "@/lib/models/all_data";
import CashSession from "@/lib/models/CashSession";

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

    // Обновляем платежи
    client.payments = payments;
    client.remainingAmount = Number(remainingAmount) || 0;
    await client.save();

    // Отправка Telegram
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

    // --- Добавляем оплату в кассу ---
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    let session = await CashSession.findOne({ date: { $gte: todayStart, $lte: todayEnd } });

    // Если касса не найдена или закрыта — открываем новую
    if (!session) {
        session = await CashSession.create({
            date: new Date(),
            status: "open",
            income: [],
            expense: [],
        });
    } else if (session.status === "closed") {
        session.status = "open";
    }

    // Добавляем приход
    if (paidPayments.length > 0) {
        const totalPaid = paidPayments.reduce((sum, p) => sum + p.paid, 0);
        session.income.push({
            amount: totalPaid,
            comment: `Оплата от клиента: ${client.name}`,
            paymentType: "cash",
            createdAt: new Date(),
        });
    }

    await session.save();

    return NextResponse.json(client);
}
