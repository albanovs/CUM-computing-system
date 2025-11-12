'use client';

import React, { useEffect, useState, useMemo } from "react";

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [installments, setInstallments] = useState([]);
    const [cashSession, setCashSession] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        async function load() {
            try {
                setLoading(true);
                const [r1, r2] = await Promise.all([
                    fetch("/api/clients").then((r) => r.json()),
                    fetch("/api/cash").then((r) => r.json()),
                ]);

                if (!mounted) return;
                const inst = Array.isArray(r1) ? r1 : r1.clients || r1;
                setInstallments(inst || []);
                setCashSession(r2?.session || r2);
            } catch (err) {
                console.error(err);
                setError(err.message || String(err));
            } finally {
                setLoading(false);
            }
        }
        load();
        return () => {
            mounted = false;
        };
    }, []);

    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const isOverdue = (payment) => {
        if (!payment) return false;
        const planDate = payment.plan_date ? new Date(payment.plan_date) : null;
        if (!planDate) return false;
        const planDateDay = new Date(planDate);
        planDateDay.setHours(0, 0, 0, 0);
        return planDateDay < today && (Number(payment.paid || 0) < Number(payment.plan || 0));
    };

    const overdueClients = useMemo(() => {
        return installments.filter((inst) => (inst.payments || []).some(isOverdue));
    }, [installments, today]);

    const dueTodayClients = useMemo(() => {
        const day = new Date().getDate();
        return installments.filter((inst) => {
            if (inst.paymentDay && Number(inst.paymentDay) === day) return true;
            const payments = inst.payments || [];
            return payments.some((p) => {
                if (!p.plan_date) return false;
                const pd = new Date(p.plan_date);
                pd.setHours(0, 0, 0, 0);
                return +pd === +today && Number(p.paid || 0) < Number(p.plan || 0);
            });
        });
    }, [installments, today]);

    const monthStats = useMemo(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        let cashIncome = 0;
        let cashExpense = 0;
        if (cashSession) {
            (cashSession.income || []).forEach((i) => {
                const d = new Date(i.createdAt || i.date);
                if (d >= start && d <= end) cashIncome += Number(i.amount || 0);
            });
            (cashSession.expense || []).forEach((e) => {
                const d = new Date(e.createdAt || e.date);
                if (d >= start && d <= end) cashExpense += Number(e.amount || 0);
            });
        }

        let installmentIncome = 0;
        installments.forEach((inst) => {
            (inst.payments || []).forEach((p) => {
                if (!p.plan_date) return;
                const d = new Date(p.plan_date);
                if (d >= start && d <= end) installmentIncome += Number(p.paid || 0);
            });
        });

        const totalIncome = cashIncome + installmentIncome;
        const net = totalIncome - cashExpense;

        return {
            cashIncome,
            cashExpense,
            installmentIncome,
            totalIncome,
            net,
        };
    }, [cashSession, installments]);

    const totalClients = installments.length;
    const totalOverdue = overdueClients.length;
    const dueTodayCount = dueTodayClients.length;
    const totalRemaining = installments.reduce((s, i) => s + (Number(i.remainingAmount || 0)), 0);

    if (loading) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-gray-600">Загрузка данных...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full min-h-screen p-6">
                <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">Ошибка: {error}</div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen">
            <div className="max-w-7xl mx-auto p-5 lg:p-0">
                <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Панель управления</h1>
                        <p className="text-sm text-gray-500">
                            Обзор клиентов, платежей и кассы — актуально на {new Date().toLocaleDateString()}
                        </p>
                    </div>
                </header>

                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow flex flex-col">
                        <div className="text-sm text-gray-500">Клиентов всего</div>
                        <div className="mt-2 text-2xl font-semibold">{totalClients}</div>
                        <div className="text-xs text-gray-400 mt-2">
                            Остаток по рассрочке: <span className="font-medium">{totalRemaining} сом</span>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow flex flex-col">
                        <div className="text-sm text-gray-500">Просроченные</div>
                        <div className="mt-2 text-2xl font-semibold text-red-600">{totalOverdue}</div>
                        <div className="text-xs text-gray-400 mt-2">Клиентов с просрочкой</div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow flex flex-col">
                        <div className="text-sm text-gray-500">Оплаты сегодня</div>
                        <div className="mt-2 text-2xl font-semibold text-amber-600">{dueTodayCount}</div>
                        <div className="text-xs text-gray-400 mt-2">Клиентов, у которых платеж сегодня</div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow flex flex-col">
                        <div className="text-sm text-gray-500">Доход (тек. мес.)</div>
                        <div className="mt-2 text-2xl font-semibold">{monthStats.totalIncome} сом</div>
                        <div className="text-xs text-gray-400 mt-2">Расходы: {monthStats.cashExpense} сом</div>
                    </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                    <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow">
                        <h2 className="text-lg font-semibold mb-3">Платежи по клиентам (последние)</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left table-auto">
                                <thead>
                                    <tr className="text-sm text-gray-500">
                                        <th className="p-2">ID</th>
                                        <th className="p-2">Имя</th>
                                        <th className="p-2">Телефон</th>
                                        <th className="p-2">Остаток</th>
                                        <th className="p-2">След. платеж</th>
                                        <th className="p-2">Статус</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {installments.slice(0, 20).map((c) => {
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
                                            <tr key={c._id} className="border-t">
                                                <td className="p-2 text-sm">{c.id || c._id.substring(0, 6)}</td>
                                                <td className="p-2 text-sm">{c.name}</td>
                                                <td className="p-2 text-sm">{c.phoneNumber}</td>
                                                <td className="p-2 text-sm">{c.remainingAmount || 0} сом</td>
                                                <td className="p-2 text-sm">
                                                    {nextDate ? nextDate.toLocaleDateString() : "—"}
                                                </td>
                                                <td className="p-2 text-sm">
                                                    <span
                                                        className={`px-2 py-1 rounded text-xs ${
                                                            status === "Просрочено"
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

                    <div className="bg-white p-4 rounded-lg shadow">
                        <h2 className="text-lg font-semibold mb-3">Касса (сейчас)</h2>
                        <div className="text-sm text-gray-600 mb-2">
                            Статус: <span className="font-medium">{cashSession?.status || "—"}</span>
                        </div>
                        <div className="mb-2">
                            <div className="text-xs text-gray-500">Доходы</div>
                            <div className="text-xl font-semibold">
                                {(cashSession?.income || []).reduce((s, i) => s + Number(i.amount || 0), 0)} сом
                            </div>
                        </div>
                        <div className="mb-2">
                            <div className="text-xs text-gray-500">Расходы</div>
                            <div className="text-xl font-semibold">
                                {(cashSession?.expense || []).reduce((s, i) => s + Number(i.amount || 0), 0)} сом
                            </div>
                        </div>

                        <div className="mt-4">
                            <h3 className="text-sm font-medium mb-2">Последние операции</h3>
                            <div className="space-y-2 max-h-48 overflow-auto">
                                {((cashSession?.income || [])
                                    .slice(-5)
                                    .map((i) => ({ ...i, type: "income" }))
                                    .concat(
                                        (cashSession?.expense || [])
                                            .slice(-5)
                                            .map((i) => ({ ...i, type: "expense" }))
                                    ))
                                    .sort(
                                        (a, b) =>
                                            new Date(b.createdAt || b.date) -
                                            new Date(a.createdAt || a.date)
                                    )
                                    .slice(0, 8)
                                    .map((op, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                            <div>
                                                <div className="font-medium">{op.comment || "—"}</div>
                                                <div className="text-xs text-gray-400">
                                                    {new Date(op.createdAt || op.date).toLocaleString()}
                                                </div>
                                            </div>
                                            <div
                                                className={`font-semibold ${
                                                    op.type === "income"
                                                        ? "text-green-600"
                                                        : "text-red-600"
                                                }`}
                                            >
                                                {op.amount} сом
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-12">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="font-semibold mb-3">Клиенты с просрочками</h3>
                        <div className="space-y-3 max-h-64 overflow-auto">
                            {overdueClients.length === 0 && (
                                <div className="text-sm text-gray-400">Нет просроченных</div>
                            )}
                            {overdueClients.map((c) => (
                                <div key={c._id} className="flex items-start gap-3">
                                    <div className="flex-1">
                                        <div className="font-medium">
                                            {c.name}{" "}
                                            <span className="text-xs text-gray-400 ml-2">
                                                {c.phoneNumber}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Остаток: {c.remainingAmount || 0} сом
                                        </div>
                                        <div className="text-xs text-red-500">
                                            Просрочка по платежам:{" "}
                                            {(c.payments || []).filter(isOverdue).length} шт
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-500">{c.id}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="font-semibold mb-3">Платежи сегодня</h3>
                        <div className="space-y-3 max-h-64 overflow-auto">
                            {dueTodayClients.length === 0 && (
                                <div className="text-sm text-gray-400">Сегодня платежей нет</div>
                            )}
                            {dueTodayClients.map((c) => (
                                <div key={c._id} className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">{c.name}</div>
                                        <div className="text-xs text-gray-500">Тел: {c.phoneNumber}</div>
                                    </div>
                                    <div className="text-sm text-gray-700">
                                        {c.remainingAmount || 0} сом
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <footer className="text-center text-xs text-gray-400 mb-8">
                    Разработано <a href="https://t.me/+996500991414">@albvnovs</a>
                </footer>
            </div>
        </div>
    );
}
