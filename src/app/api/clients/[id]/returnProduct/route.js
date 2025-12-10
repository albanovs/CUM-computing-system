import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/db";
import { InstallmentModel } from "../../../../../lib/models/all_data";
import { warehouseModel } from "../../../../../lib/models/warehouse";

const TELEGRAM_BOT_TOKEN = '8396661511:AAHXdQYMm_NPAN1hbFw2Owmn6kgsJ6_j2T0';
const TELEGRAM_CHAT_ID = '-4938428460';

// рекурсивная функция для удаления всех _id
function stripIds(obj) {
    if (Array.isArray(obj)) return obj.map(stripIds);
    if (obj && typeof obj === 'object') {
        const res = {};
        for (let key in obj) {
            if (key === '_id') continue; // пропускаем _id
            res[key] = stripIds(obj[key]);
        }
        return res;
    }
    return obj;
}

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
    const { productIMEI, remainingAmount } = await req.json();

    if (!productIMEI) {
        return NextResponse.json({ error: "IMEI товара не указан" }, { status: 400 });
    }

    const client = await InstallmentModel.findById(id);
    if (!client) {
        return NextResponse.json({ error: "Клиент не найден" }, { status: 404 });
    }

    const productIndex = client.product.findIndex(p => p.IMEI === productIMEI);
    if (productIndex === -1) {
        return NextResponse.json({ error: "Товар не найден у клиента" }, { status: 404 });
    }

    const product = client.product[productIndex];

    // 1️⃣ Создаём новый объект для склада без _id рекурсивно
    const productForWarehouse = stripIds(product);
    await warehouseModel.create(productForWarehouse);

    // 2️⃣ Удаляем товар из клиента
    client.product.splice(productIndex, 1);

    // 3️⃣ Обновляем остаток
    client.remainingAmount = remainingAmount !== undefined
        ? remainingAmount
        : client.product.reduce((sum, p) => sum + (p.price || 0), 0);

    await client.save();

    // 4️⃣ Отправка Telegram уведомления
    await sendTelegramMessage(
        `<b>Товар возвращен на склад</b>\nКлиент: ${client.name}\nТелефон: ${client.phoneNumber}\nМодель: ${product.phoneModel}\nIMEI: ${product.IMEI}`
    );

    return NextResponse.json(client);
}
