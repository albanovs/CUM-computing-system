"use client";

import React, { useEffect, useState } from "react";

const PAGE_SIZE = 6;

export default function CashPage() {
    const [cashSession, setCashSession] = useState(null);
    const [operations, setOperations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const [newOpAmount, setNewOpAmount] = useState("");
    const [newOpType, setNewOpType] = useState("income");
    const [newOpComment, setNewOpComment] = useState("");
    const [newOpPayment, setNewOpPayment] = useState("cash");

    const [message, setMessage] = useState(null);

    const fetchCash = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/cash");
            const data = await res.json();
            setCashSession(data.session || null);

            if (data.session) {
                const ops = [
                    ...data.session.income.map(op => ({ ...op, type: "income" })),
                    ...data.session.expense.map(op => ({ ...op, type: "expense" }))
                ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setOperations(ops);
            } else {
                setOperations([]);
            }
        } catch {
            setCashSession(null);
            setOperations([]);
            setMessage({ type: "error", text: "Ошибка при загрузке данных кассы" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCash(); }, []);

    const handleOpenCash = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/cash", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "open" }),
            });
            const data = await res.json();
            setCashSession(data.session);
            setOperations([]);
            setMessage({ type: "success", text: "Касса открыта" });
        } catch {
            setMessage({ type: "error", text: "Не удалось открыть кассу" });
        } finally {
            setLoading(false);
        }
    };

    const handleCloseCash = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/cash", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "close" }),
            });
            const data = await res.json();
            setCashSession(data.session);
            setOperations([]);
            setMessage({ type: "success", text: "Касса закрыта" });
        } catch {
            setMessage({ type: "error", text: "Не удалось закрыть кассу" });
        } finally {
            setLoading(false);
        }
    };

    const handleAddOperation = async () => {
        if (!cashSession?.status || cashSession.status !== "open") {
            setMessage({ type: "error", text: "Сначала откройте кассу" });
            return;
        }
        if (!newOpAmount || isNaN(newOpAmount)) {
            setMessage({ type: "error", text: "Введите корректную сумму" });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/cash", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "operation",
                    type: newOpType,
                    amount: Number(newOpAmount),
                    comment: newOpComment,
                    paymentType: newOpPayment,
                }),
            });
            if (!res.ok) throw new Error();
            const data = await res.json();

            const opWithType = { ...data.operation, type: newOpType };
            setOperations(prev => [opWithType, ...prev]);

            setNewOpAmount("");
            setNewOpComment("");
            setNewOpType("income");
            setNewOpPayment("cash");
            setMessage({ type: "success", text: "Операция добавлена" });
        } catch {
            setMessage({ type: "error", text: "Ошибка при добавлении операции" });
        } finally {
            setLoading(false);
        }
    };

    const totalCash = operations.reduce(
        (acc, op) => op.type === "income" ? acc + op.amount : acc - op.amount, 0
    );

    const pageCount = Math.ceil(operations.length / PAGE_SIZE);
    const paginatedOps = operations.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const handlePrev = () => setCurrentPage(p => Math.max(p - 1, 1));
    const handleNext = () => setCurrentPage(p => Math.min(p + 1, pageCount));

    return (
        <div className="p-4 md:p-6 text-sm md:text-base">
            <h1 className="text-xl md:text-2xl font-bold mb-4">Касса</h1>

            {message && (
                <div className={`mb-4 p-2 rounded ${message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                    {message.text}
                </div>
            )}

            <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <span className="font-semibold">Сумма на сегодня: </span>
                    <span className="text-green-600 font-bold">{totalCash} ₽</span>
                </div>

                <div className="flex gap-2">
                    {!cashSession?.status || cashSession.status !== "open" ? (
                        <button
                            onClick={handleOpenCash}
                            disabled={loading}
                            className={`bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition flex items-center justify-center gap-2 ${loading ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"></path>
                                    </svg>
                                    Открыть кассу
                                </>
                            ) : (
                                "Открыть кассу"
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={handleCloseCash}
                            disabled={loading}
                            className={`bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition flex items-center justify-center gap-2 ${loading ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"></path>
                                    </svg>
                                    Закрыть кассу
                                </>
                            ) : (
                                "Закрыть кассу"
                            )}
                        </button>
                    )}
                </div>
            </div>

            {cashSession?.status === "open" && (
                <div className="mb-4 flex flex-col md:flex-row md:items-center md:gap-2">
                    <input type="number" placeholder="Сумма" value={newOpAmount} onChange={e => setNewOpAmount(e.target.value)} className="border p-2 rounded w-full md:w-32" />
                    <select value={newOpType} onChange={e => setNewOpType(e.target.value)} className="border p-2 rounded w-full md:w-32">
                        <option value="income">Приход</option>
                        <option value="expense">Расход</option>
                    </select>
                    <select value={newOpPayment} onChange={e => setNewOpPayment(e.target.value)} className="border p-2 rounded w-full md:w-32">
                        <option value="cash">Нал</option>
                        <option value="non-cash">Безнал</option>
                    </select>
                    <input type="text" placeholder="Комментарий" value={newOpComment} onChange={e => setNewOpComment(e.target.value)} className="border p-2 rounded w-full md:w-64" />
                    <button onClick={handleAddOperation} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                        Добавить
                    </button>
                </div>
            )}

            <div className="overflow-auto min-h-[300px]">
                {paginatedOps.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">Нет операций</div>
                ) : (
                    <table className="w-full table-auto border-collapse">
                        <thead>
                            <tr className="bg-gray-200 sticky top-0 z-10">
                                <th className="p-2 border">Сумма</th>
                                <th className="p-2 border">Тип</th>
                                <th className="p-2 border">Оплата</th>
                                <th className="p-2 border">Комментарий</th>
                                <th className="p-2 border">Время</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedOps.map((op, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className={`p-2 border ${op.type === "income" ? "text-green-600" : "text-red-600"}`}>{op.amount} ₽</td>
                                    <td className="p-2 border">{op.type === "income" ? "Приход" : "Расход"}</td>
                                    <td className="p-2 border">{op.paymentType === "cash" ? "Нал" : "Безнал"}</td>
                                    <td className="p-2 border">{op.comment || "-"}</td>
                                    <td className="p-2 border">{new Date(op.createdAt).toLocaleTimeString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {pageCount > 1 && (
                <div className="flex justify-center gap-2 mt-2">
                    <button onClick={handlePrev} disabled={currentPage === 1} className="px-3 py-1 border rounded disabled:opacity-50">Назад</button>
                    <span className="px-2 py-1">{currentPage} / {pageCount}</span>
                    <button onClick={handleNext} disabled={currentPage === pageCount} className="px-3 py-1 border rounded disabled:opacity-50">Вперёд</button>
                </div>
            )}
        </div>
    );
}
