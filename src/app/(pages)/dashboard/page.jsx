"use client";

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchClients } from "../../../lib/slices/clientsSlice";
import { fetchCashSession } from "../../../lib/slices/cashSlice";

export default function Dashboard() {
    const dispatch = useDispatch();
    const { list: clients, loading: clientsLoading, error: clientsError } = useSelector(
        (state) => state.clients
    );
    const { session: cashSession, loading: cashLoading, error: cashError } = useSelector(
        (state) => state.cash
    );
    const loading = clientsLoading || cashLoading;
    const error = clientsError || cashError;

    useEffect(() => {
        dispatch(fetchClients());
        dispatch(fetchCashSession());
    }, [dispatch]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isOverdue = (payment) => {
        if (!payment) return false;
        const planDate = payment.plan_date ? new Date(payment.plan_date) : null;
        if (!planDate) return false;
        planDate.setHours(0, 0, 0, 0);
        return planDate < today && (Number(payment.paid || 0) < Number(payment.plan || 0));
    };

    const overdueClients = clients.filter((inst) => (inst.payments || []).some(isOverdue));
    const dueTodayClients = clients.filter((inst) =>
        (inst.payments || []).some(
            (p) =>
                p.plan_date &&
                new Date(p.plan_date).setHours(0, 0, 0, 0) === today.getTime() &&
                Number(p.paid || 0) < Number(p.plan || 0)
        )
    );

    // --- корректный подсчёт остатка ---
    const totalRemaining = clients.reduce(
        (acc, client) => {
            const currency = (client.currency || "СОМ").toUpperCase();
            acc[currency] = (acc[currency] || 0) + Number(client.remainingAmount || 0);
            return acc;
        },
        { "СОМ": 0, "USD": 0 }
    );

    const monthStats = React.useMemo(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        let cashIncome = { "СОМ": 0, "USD": 0 };
        let cashExpense = { "СОМ": 0, "USD": 0 };
        if (cashSession) {
            (cashSession.income || []).forEach((i) => {
                const d = new Date(i.createdAt || i.date);
                if (d >= start && d <= end) {
                    const c = (i.currency || "СОМ").toUpperCase();
                    cashIncome[c] = (cashIncome[c] || 0) + Number(i.amount || 0);
                }
            });
            (cashSession.expense || []).forEach((e) => {
                const d = new Date(e.createdAt || e.date);
                if (d >= start && d <= end) {
                    const c = (e.currency || "СОМ").toUpperCase();
                    cashExpense[c] = (cashExpense[c] || 0) + Number(e.amount || 0);
                }
            });
        }

        let installmentIncome = { "СОМ": 0, "USD": 0 };
        clients.forEach((inst) => {
            (inst.payments || []).forEach((p) => {
                if (!p.plan_date) return;
                const d = new Date(p.plan_date);
                if (d >= start && d <= end) {
                    const c = (p.currency || "СОМ").toUpperCase();
                    installmentIncome[c] = (installmentIncome[c] || 0) + Number(p.paid || 0);
                }
            });
        });

        const totalIncome = {
            "СОМ": cashIncome["СОМ"] + installmentIncome["СОМ"],
            "USD": cashIncome["USD"] + installmentIncome["USD"]
        };
        const net = {
            "СОМ": totalIncome["СОМ"] - cashExpense["СОМ"],
            "USD": totalIncome["USD"] - cashExpense["USD"]
        };

        return {
            cashIncome,
            cashExpense,
            installmentIncome,
            totalIncome,
            net
        };
    }, [cashSession, clients]);

    if (loading) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center animate-fade-in">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <div className="mt-4 text-gray-600 text-lg font-medium">Загрузка данных...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full min-h-screen p-6 flex items-center justify-center">
                <div className="max-w-4xl bg-white p-6 rounded-2xl shadow text-red-600 font-medium">
                    Ошибка: {error}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8 bg-gray-50">
            <div className="max-w-7xl mx-auto space-y-6">
                <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <h1 className="text-3xl font-extrabold text-gray-900">Панель управления</h1>
                    <p className="text-gray-500 text-sm">
                        Обзор клиентов, платежей и кассы — актуально на {new Date().toLocaleDateString()}
                    </p>
                </header>

                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow hover:shadow-xl transition flex flex-col">
                        <span className="text-sm text-gray-400">Клиентов всего</span>
                        <span className="mt-2 text-3xl font-bold text-gray-900">{clients.length}</span>
                        <span className="text-xs text-gray-500 mt-1">
                            Остаток: <span className="font-medium">{totalRemaining["СОМ"]} сом</span>, <span className="font-medium">{totalRemaining["USD"]} USD</span>
                        </span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow hover:shadow-xl transition flex flex-col">
                        <span className="text-sm text-gray-400">Просроченные</span>
                        <span className="mt-2 text-3xl font-bold text-red-600">{overdueClients.length}</span>
                        <span className="text-xs text-gray-500 mt-1">Клиентов с просрочкой</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow hover:shadow-xl transition flex flex-col">
                        <span className="text-sm text-gray-400">Оплаты сегодня</span>
                        <span className="mt-2 text-3xl font-bold text-amber-600">{dueTodayClients.length}</span>
                        <span className="text-xs text-gray-500 mt-1">Клиентов с платежом сегодня</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow hover:shadow-xl transition flex flex-col">
                        <span className="text-sm text-gray-400">Доход (текущий месяц)</span>
                        <div className="mt-2 space-y-1">
                            <span className="text-2xl font-bold text-green-600">{monthStats.totalIncome["СОМ"]} сом</span>
                            <span className="text-2xl font-bold text-green-600">{monthStats.totalIncome["USD"]} USD</span>
                        </div>
                        <span className="text-xs text-gray-500 mt-1">
                            Расходы: {monthStats.cashExpense["СОМ"]} сом, {monthStats.cashExpense["USD"]} USD
                        </span>
                    </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Последние платежи клиентов */}
                    <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow hover:shadow-xl transition">
                        <h2 className="text-xl font-semibold mb-4">Платежи по клиентам (последние)</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full table-auto border-collapse text-sm text-gray-700">
                                <thead className="bg-gray-100 text-gray-500">
                                    <tr>
                                        <th className="p-2">ID</th>
                                        <th className="p-2">Имя</th>
                                        <th className="p-2">Телефон</th>
                                        <th className="p-2">Остаток</th>
                                        <th className="p-2">След. платеж</th>
                                        <th className="p-2">Статус</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clients.slice(0, 20).map((c) => {
                                        const nextPayment = (c.payments || []).find(
                                            (p) => Number(p.paid || 0) < Number(p.plan || 0)
                                        );
                                        const nextDate = nextPayment ? new Date(nextPayment.plan_date) : null;
                                        const status = (c.payments || []).some(isOverdue)
                                            ? "Просрочено"
                                            : nextPayment
                                                ? "Ждёт оплату"
                                                : "Выплачено";

                                        return (
                                            <tr key={c._id} className="border-b hover:bg-gray-50 transition">
                                                <td className="p-2">{c.id || c._id.substring(0, 6)}</td>
                                                <td className="p-2">{c.name}</td>
                                                <td className="p-2">{c.phoneNumber}</td>
                                                <td className="p-2">
                                                    {c.currency?.toUpperCase() === "USD"
                                                        ? `${c.remainingAmount} USD`
                                                        : `${c.remainingAmount} сом`}
                                                </td>
                                                <td className="p-2">{nextDate ? nextDate.toLocaleDateString() : "—"}</td>
                                                <td className="p-2">
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs font-medium ${status === "Просрочено"
                                                            ? "bg-red-100 text-red-700"
                                                            : status === "Выплачено"
                                                                ? "bg-green-100 text-green-700"
                                                                : "bg-amber-100 text-amber-700"
                                                            }`}
                                                    >
                                                        {status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Касса */}
                    <div className="bg-white p-5 rounded-2xl shadow hover:shadow-xl transition">
                        <h2 className="text-xl font-semibold mb-4">Касса (сейчас)</h2>
                        <div className="text-sm text-gray-600 mb-3">
                            Статус: <span className="font-medium">{cashSession?.status || "—"}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <div className="text-xs text-gray-500">Доходы (сом)</div>
                                <div className="text-2xl font-bold text-green-600">
                                    {(cashSession?.income || [])
                                        .filter(i => (i.currency || "СОМ").toUpperCase() === "СОМ")
                                        .reduce((s, i) => s + Number(i.amount || 0), 0)}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">Доходы (USD)</div>
                                <div className="text-2xl font-bold text-green-600">
                                    {(cashSession?.income || [])
                                        .filter(i => (i.currency || "СОМ").toUpperCase() === "USD")
                                        .reduce((s, i) => s + Number(i.amount || 0), 0)}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">Расходы (сом)</div>
                                <div className="text-2xl font-bold text-red-600">
                                    {(cashSession?.expense || [])
                                        .filter(i => (i.currency || "СОМ").toUpperCase() === "СОМ")
                                        .reduce((s, i) => s + Number(i.amount || 0), 0)}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">Расходы (USD)</div>
                                <div className="text-2xl font-bold text-red-600">
                                    {(cashSession?.expense || [])
                                        .filter(i => (i.currency || "СОМ").toUpperCase() === "USD")
                                        .reduce((s, i) => s + Number(i.amount || 0), 0)}
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium mb-2">Последние операции</h3>
                            <div className="space-y-2 max-h-80 overflow-auto">
                                {((cashSession?.income || []).map(i => ({ ...i, type: "income" }))
                                    .concat((cashSession?.expense || []).map(i => ({ ...i, type: "expense" }))))
                                    .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
                                    .slice(0, 8)
                                    .map((op, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                            <div>
                                                <div className="font-medium">{op.comment || "—"}</div>
                                                <div className="text-xs text-gray-400">
                                                    {new Date(op.createdAt || op.date).toLocaleString()}
                                                </div>
                                            </div>
                                            <div className={`font-semibold ${op.type === "income" ? "text-green-600" : "text-red-600"}`}>
                                                {op.amount} {(op.currency || "СОМ").toUpperCase()}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
