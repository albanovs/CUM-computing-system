"use client";

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchClients } from "@/lib/slices/clientsSlice";
import { fetchCashSession } from "@/lib/slices/cashSlice";

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

    const totalRemaining = clients.reduce((s, i) => s + Number(i.remainingAmount || 0), 0);

    const monthStats = React.useMemo(() => {
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
        clients.forEach((inst) => {
            (inst.payments || []).forEach((p) => {
                if (!p.plan_date) return;
                const d = new Date(p.plan_date);
                if (d >= start && d <= end) installmentIncome += Number(p.paid || 0);
            });
        });

        const totalIncome = cashIncome + installmentIncome;
        const net = totalIncome - cashExpense;

        return { cashIncome, cashExpense, installmentIncome, totalIncome, net };
    }, [cashSession, clients]);

    if (loading) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
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
                <div className="max-w-4xl bg-white p-6 rounded-lg shadow text-red-600 font-medium">
                    Ошибка: {error}
                </div>
            </div>
        );
    }

    return (
        <div className="mb-20 w-full min-h-screen rounded-2xl bg-slate-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Панель управления</h1>
                    <p className="text-sm text-gray-500">
                        Обзор клиентов, платежей и кассы — актуально на {new Date().toLocaleDateString()}
                    </p>
                </header>

                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition duration-300 flex flex-col">
                        <div className="text-sm text-gray-400">Клиентов всего</div>
                        <div className="mt-2 text-3xl font-bold text-gray-800">{clients.length}</div>
                        <div className="text-xs text-gray-500 mt-2">
                            Остаток по рассрочке: <span className="font-medium">{totalRemaining} сом</span>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition duration-300 flex flex-col">
                        <div className="text-sm text-gray-400">Просроченные</div>
                        <div className="mt-2 text-3xl font-bold text-red-600">{overdueClients.length}</div>
                        <div className="text-xs text-gray-500 mt-2">Клиентов с просрочкой</div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition duration-300 flex flex-col">
                        <div className="text-sm text-gray-400">Оплаты сегодня</div>
                        <div className="mt-2 text-3xl font-bold text-amber-600">{dueTodayClients.length}</div>
                        <div className="text-xs text-gray-500 mt-2">Клиентов, у которых платеж сегодня</div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition duration-300 flex flex-col">
                        <div className="text-sm text-gray-400">Доход (тек. мес.)</div>
                        <div className="mt-2 text-3xl font-bold text-green-600">{monthStats.totalIncome} сом</div>
                        <div className="text-xs text-gray-500 mt-2">Расходы: {monthStats.cashExpense} сом</div>
                    </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow hover:shadow-lg transition duration-300">
                        <h2 className="text-xl font-semibold mb-4">Платежи по клиентам (последние)</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left table-auto border-collapse">
                                <thead>
                                    <tr className="text-sm text-gray-500 border-b">
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
                                                <td className="p-2 text-sm">{c.id || c._id.substring(0, 6)}</td>
                                                <td className="p-2 text-sm">{c.name}</td>
                                                <td className="p-2 text-sm">{c.phoneNumber}</td>
                                                <td className="p-2 text-sm">{c.remainingAmount || 0} сом</td>
                                                <td className="p-2 text-sm">{nextDate ? nextDate.toLocaleDateString() : "—"}</td>
                                                <td className="p-2 text-sm">
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

                    <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition duration-300">
                        <h2 className="text-xl font-semibold mb-4">Касса (сейчас)</h2>
                        <div className="text-sm text-gray-600 mb-3">
                            Статус: <span className="font-medium">{cashSession?.status || "—"}</span>
                        </div>
                        <div className="flex justify-between mb-3">
                            <div>
                                <div className="text-xs text-gray-500">Доходы</div>
                                <div className="text-2xl font-bold text-green-600">
                                    {(cashSession?.income || []).reduce((s, i) => s + Number(i.amount || 0), 0)} сом
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">Расходы</div>
                                <div className="text-2xl font-bold text-red-600">
                                    {(cashSession?.expense || []).reduce((s, i) => s + Number(i.amount || 0), 0)} сом
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium mb-2">Последние операции</h3>
                            <div className="space-y-2 max-h-80 overflow-auto">
                                {((cashSession?.income || [])
                                    .slice(-5)
                                    .map((i) => ({ ...i, type: "income" }))
                                    .concat((cashSession?.expense || []).slice(-5).map((i) => ({ ...i, type: "expense" }))))
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
                                            <div
                                                className={`font-semibold ${op.type === "income" ? "text-green-600" : "text-red-600"}`}
                                            >
                                                {op.amount} сом
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
                    <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition duration-300">
                        <h3 className="font-semibold text-lg mb-3">Клиенты с просрочками</h3>
                        <div className="space-y-3 max-h-80 overflow-auto">
                            {overdueClients.length === 0 && (
                                <div className="text-sm text-gray-400">Нет просроченных</div>
                            )}
                            {overdueClients.map((c) => (
                                <div key={c._id} className="flex items-start justify-between bg-gray-50 p-3 rounded-lg shadow-sm">
                                    <div>
                                        <div className="font-medium">{c.name} <span className="text-xs text-gray-400">{c.phoneNumber}</span></div>
                                        <div className="text-xs text-gray-500">Остаток: {c.remainingAmount || 0} сом</div>
                                        <div className="text-xs text-red-500">Просрочено: {(c.payments || []).filter(isOverdue).length} платежей</div>
                                    </div>
                                    {/* <div className="text-sm text-gray-500">{c.remainingAmount || 0}</div> */}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition duration-300">
                        <h3 className="font-semibold text-lg mb-3">Платежи сегодня</h3>
                        <div className="space-y-3 max-h-80 overflow-auto">
                            {dueTodayClients.length === 0 && <div className="text-sm text-gray-400">Сегодня платежей нет</div>}
                            {dueTodayClients.map((c) => (
                                <div key={c._id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg shadow-sm">
                                    <div>
                                        <div className="font-medium">{c.name}</div>
                                        <div className="text-xs text-gray-500">Тел: {c.phoneNumber}</div>
                                    </div>
                                    <div className="text-sm text-gray-700">{c.remainingAmount || 0} сом</div>
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
