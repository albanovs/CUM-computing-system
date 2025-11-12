import { connectDB } from "@/lib/db";
import CashSession from "@/lib/models/CashSession";

await connectDB();

// Получить сегодняшнюю сессию
export async function GET(req) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const session = await CashSession.findOne({
        date: { $gte: todayStart, $lte: todayEnd },
        status: "open",
    });

    return new Response(JSON.stringify({ session }), { status: 200 });
}

// Создать/обновить сессию или добавить операцию
export async function POST(req) {
    const { action, type, amount, comment, paymentType } = await req.json();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    let session = await CashSession.findOne({
        date: { $gte: todayStart, $lte: todayEnd },
    });

    if (action === "open") {
        if (!session) {
            session = await CashSession.create({
                date: new Date(),
                status: "open",
                income: [],
                expense: [],
            });
        } else {
            session.status = "open";
            await session.save();
        }
        return new Response(JSON.stringify({ session }), { status: 200 });
    }

    if (action === "close") {
        if (!session) return new Response(JSON.stringify({ error: "Сессия не найдена" }), { status: 400 });
        session.status = "closed";
        await session.save();
        return new Response(JSON.stringify({ session }), { status: 200 });
    }

    if (action === "operation") {
        if (!session || session.status !== "open")
            return new Response(JSON.stringify({ error: "Касса закрыта" }), { status: 400 });

        const op = {
            amount,
            comment,
            paymentType: paymentType || "cash",
            createdAt: new Date(),
        };

        if (type === "income") session.income.push(op);
        else session.expense.push(op);

        await session.save();
        return new Response(JSON.stringify({ session, operation: op }), { status: 200 });
    }

    return new Response("Method Not Allowed", { status: 405 });
}
