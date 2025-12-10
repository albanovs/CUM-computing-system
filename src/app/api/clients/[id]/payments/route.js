import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/db";
import { InstallmentModel } from "../../../../../lib/models/all_data";
import CashSession from "../../../../../lib/models/CashSession";

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

    // --- Обновляем платежи клиента ---
    client.payments = payments;
    client.remainingAmount = Number(remainingAmount) || 0;
    await client.save();

    // --- Отправка Telegram (только новые платежи) ---
    const paidPayments = payments.filter(p => p.paid > 0);
    if (paidPayments.length > 0) {
        const lastPaidIds = client.lastPaidTelegramIds || [];
        const newPayments = paidPayments.filter(p => !lastPaidIds.includes(p._id));

        if (newPayments.length > 0) {
            // Сохраняем ID новых платежей сразу, до отправки
            client.lastPaidTelegramIds = [...lastPaidIds, ...newPayments.map(p => p._id)];
            await client.save();

            let message = `<b>Клиент внёс оплату</b>\n`;
            message += `Имя: ${client.name}\nТелефон: ${client.phoneNumber}\n`;
            message += `<b>Платежи:</b>\n`;

            newPayments.forEach(p => {
                const date = new Date(p.plan_date).toLocaleString("ru-RU", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                });
                const overdue = p.overdueDays > 0 ? ` (Просрочка: ${p.overdueDays} дн.)` : '';
                message += `Дата: ${date}, План: ${p.plan} ${p.currency || 'СОМ'}, Оплачено: ${p.paid} ${p.currency || 'СОМ'}${overdue}\n`;
            });

            message += `\nОстаток: ${client.remainingAmount} ${paidPayments[0]?.currency || 'СОМ'}\n`;

            await sendTelegramMessage(message);
        }
    }

    // --- Работа с кассой ---
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    let session = await CashSession.findOne({ date: { $gte: todayStart, $lte: todayEnd } });

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

    for (const p of paidPayments) {
        // Проверка: не дублируем платеж в кассе
        const exists = session.income.some(i =>
            i.amount === p.paid &&
            i.comment.includes(client.name)
        );

        if (!exists) {
            session.income.push({
                amount: p.paid,
                currency: p.currency || "СОМ",
                comment: `Оплата от клиента: ${client.name}`,
                paymentType: "cash",
                createdAt: new Date(),
            });
        }
    }

    await session.save();

    return NextResponse.json(client);
}
