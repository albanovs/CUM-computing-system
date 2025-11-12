"use client";

import React, { useState, useEffect } from "react";

export default function Modal({ data, onClose, onUpdated }) {
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [error, setError] = useState("");

    const isPaidOff = Number(data.remainingAmount) === 0;

    const getNextPaymentDate = () => {
        const today = new Date();
        const unpaidPayments = data.payments?.filter(p => (p.plan - (p.paid || 0)) > 0);
        if (!unpaidPayments || unpaidPayments.length === 0) return null;

        const next = unpaidPayments.find(p => new Date(p.plan_date) >= today);
        return next ? new Date(next.plan_date) : new Date(unpaidPayments[0].plan_date);
    };

    const [nextPaymentDate, setNextPaymentDate] = useState(getNextPaymentDate());

    useEffect(() => {
        if (!isPaidOff) setNextPaymentDate(getNextPaymentDate());
    }, [data]);

    const handleSubmit = async () => {
        setError("");

        if (!amount) {
            setError("Введите сумму оплаты");
            return;
        }

        let remainingPayment = Number(amount);
        if (remainingPayment <= 0) {
            setError("Сумма должна быть больше 0");
            return;
        }

        if (remainingPayment > data.remainingAmount) {
            setError(`Сумма платежа (${amount}) превышает остаток (${data.remainingAmount})`);
            return;
        }

        const paymentsCopy = data.payments.map(p => ({
            plan_date: new Date(p.plan_date),
            plan: Number(p.plan),
            paid: Number(p.paid) || 0,
            comment: p.comment || "",
            overdueDays: Number(p.overdueDays) || 0
        }));

        for (let i = 0; i < paymentsCopy.length; i++) {
            const p = paymentsCopy[i];
            const unpaid = p.plan - p.paid;
            if (unpaid <= 0) continue;

            const today = new Date(date);
            const planDate = new Date(p.plan_date);
            const diffTime = today - planDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 0) {
                p.overdueDays = diffDays;
            }

            if (remainingPayment >= unpaid) {
                p.paid += unpaid;
                remainingPayment -= unpaid;
            } else {
                p.paid += remainingPayment;
                remainingPayment = 0;
                break;
            }
        }

        const newRemaining = paymentsCopy.reduce((sum, p) => sum + (p.plan - p.paid), 0);

        try {
            const res = await fetch(`/api/clients/${data._id}/payments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ payments: paymentsCopy, remainingAmount: newRemaining }),
            });

            const updated = await res.json();

            if (!res.ok) {
                setError(updated.error || "Ошибка при отправке оплаты");
                return;
            }

            onUpdated(updated);
            setAmount("");
            setDate(new Date().toISOString().slice(0, 10));
            setNextPaymentDate(getNextPaymentDate());
        } catch (err) {
            console.error(err);
            setError("Ошибка при отправке оплаты");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md md:max-w-lg rounded-2xl shadow-xl overflow-hidden animate-fade-in">

                <div className="px-6 py-4 bg-blue-600 text-white flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Данные клиента: {data.name}</h2>
                    <button onClick={onClose} className="text-white text-xl font-bold hover:text-gray-200">&times;</button>
                </div>

                <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                    <p className="mb-2"><strong>Дата покупки:</strong> {data.data_register ? new Date(data.data_register).toLocaleDateString("ru-RU") : "-"}</p>
                    <p className="mb-2"><strong>Адрес:</strong> {data.address}</p>
                    <p className="mb-2"><strong>Марка телефона:</strong> {data.phoneModel}</p>
                    <p className="mb-2"><strong>Номер телефона:</strong> {data.phoneNumber}</p>
                    <p className="mb-2"><strong>Остаток:</strong> {data.remainingAmount}</p>

                    {!isPaidOff && (
                        <p className="mt-2 mb-4 text-sm">
                            Следующая оплата: <span className="text-blue-600 font-medium">{nextPaymentDate?.toLocaleDateString("ru-RU")}</span>
                        </p>
                    )}

                    {error && <p className="text-red-600 mb-2 text-sm font-medium">{error}</p>}

                    {!isPaidOff && (
                        <>
                            <input
                                type="number"
                                placeholder="Сумма"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="border border-gray-300 p-2 rounded w-full mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="border border-gray-300 p-2 rounded w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        </>
                    )}

                    <h3 className="text-lg font-semibold mb-2">История оплат</h3>
                    <ul className="overflow-y-scroll h-40 border rounded p-2 bg-gray-50">
                        {data.payments?.map((p, i) => (
                            <li key={i} className="flex justify-between p-2 border-b text-sm last:border-b-0">
                                <span>
                                    План: {p.plan} сом / Факт: {p.paid || 0} сом
                                </span>
                                <span>
                                    План дата: {new Date(p.plan_date).toLocaleDateString("ru-RU")}<br />
                                    Просрочка: {p.overdueDays || 0} дн.
                                </span>
                            </li>
                        ))}
                        {!data.payments?.length && <li className="text-gray-400 text-center py-2">Оплаты отсутствуют</li>}
                    </ul>
                </div>

                {!isPaidOff && (
                    <div className="px-6 py-4 flex justify-end gap-2 border-t">
                        <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition">Отмена</button>
                        <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">Внести</button>
                    </div>
                )}
            </div>
        </div>
    );
}
