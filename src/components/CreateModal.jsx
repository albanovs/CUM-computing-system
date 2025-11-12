"use client";

import React, { useState } from "react";

export default function CreateModal({ onClose, onCreated }) {
    const [form, setForm] = useState({
        id: "",
        code: "",
        name: "",
        phoneNumber: "",
        address: "",
        phoneModel: "",
        phonePrice: "",
        installmentTerm: "",
        paymentDay: "",
        firstPaymentAmount: "",
        isInstallment: false,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPlan, setShowPlan] = useState(false);
    const [planSummary, setPlanSummary] = useState(null);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const generatePlan = () => {
        const price = parseFloat(form.phonePrice) || 0;
        const term = parseInt(form.installmentTerm) || 0;
        const day = parseInt(form.paymentDay) || 1;
        const firstPaymentAmount = parseFloat(form.firstPaymentAmount) || 0;

        const totalAfterDown = price - firstPaymentAmount;
        const monthlyPayment = totalAfterDown / term;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const payments = [];
        for (let i = 0; i < term; i++) {
            const payDate = new Date(today.getFullYear(), today.getMonth() + 1 + i, day);
            payDate.setHours(0, 0, 0, 0);

            payments.push({
                plan_date: payDate,
                plan: Math.round(monthlyPayment),
                paid: 0,
                comment: "",
            });
        }

        return { monthlyPayment, payments, totalAfterDown };
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");

        if (!form.name || !form.phoneNumber) {
            setError("Имя и телефон обязательны");
            return;
        }

        if (form.isInstallment) {
            if (!form.installmentTerm || !form.paymentDay) {
                setError("Укажите срок рассрочки и день месяца");
                return;
            }

            if (Number(form.firstPaymentAmount) > Number(form.phonePrice)) {
                setError("Первоначальный взнос не может превышать цену телефона");
                return;
            }

            const plan = generatePlan();
            setPlanSummary(plan);
            setShowPlan(true);
        } else {
            createClient();
        }
    };

    const createClient = async () => {
        setLoading(true);
        try {
            const price = parseFloat(form.phonePrice) || 0;
            const firstPaymentAmount = parseFloat(form.firstPaymentAmount) || 0;

            const body = {
                ...form,
                phonePrice: price,
                data_register: new Date(),
                payments: [],
                remainingAmount: form.isInstallment ? (price - firstPaymentAmount) : 0,
                firstPaymentAmount: firstPaymentAmount,
            };

            if (form.isInstallment && planSummary) {
                body.payments = planSummary.payments;
                body.remainingAmount = planSummary.totalAfterDown;
            } else {
                body.payments.push({
                    plan_date: new Date(),
                    plan: price,
                    paid: price,
                    comment: "Полная оплата",
                });
                body.remainingAmount = 0;
            }

            const res = await fetch("/api/clients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Ошибка при создании клиента");
                setLoading(false);
                return;
            }

            setShowPlan(false);
            onCreated(data);
        } catch (err) {
            console.error(err);
            setError("Ошибка при создании клиента");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white w-full max-w-md md:max-w-lg rounded-2xl shadow-xl overflow-auto animate-fade-in">
                    <div className="px-6 py-4 bg-green-600 text-white flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Создать клиента</h2>
                        <button onClick={onClose} className="text-white text-xl font-bold hover:text-gray-200">&times;</button>
                    </div>

                    <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="flex gap-1">
                            <input name="id" placeholder="ID" value={form.id} onChange={handleChange} className="border p-2 w-full rounded focus:ring-2 focus:ring-green-400" />
                            <input name="code" placeholder="Код" value={form.code} onChange={handleChange} className="border p-2 w-full rounded focus:ring-2 focus:ring-green-400" />
                        </div>

                        <div className="flex gap-1">
                            <input name="name" placeholder="Имя" value={form.name} onChange={handleChange} className="border p-2 w-full rounded focus:ring-2 focus:ring-green-400" />
                            <input name="phoneNumber" placeholder="Телефон" value={form.phoneNumber} onChange={handleChange} className="border p-2 w-full rounded focus:ring-2 focus:ring-green-400" />
                        </div>

                        <div className="flex gap-1">
                            <input name="phoneModel" placeholder="Модель телефона" value={form.phoneModel} onChange={handleChange} className="border p-2 w-full rounded focus:ring-2 focus:ring-green-400" />
                            <input name="phonePrice" placeholder="Цена" type="number" value={form.phonePrice} onChange={handleChange} className="border p-2 w-full rounded focus:ring-2 focus:ring-green-400" />
                        </div>

                        <div className="flex items-center space-x-2">
                            <input type="checkbox" name="isInstallment" checked={form.isInstallment} onChange={handleChange} />
                            <label className="text-sm">Рассрочка</label>
                        </div>

                        {form.isInstallment && (
                            <div className="flex gap-1">
                                <div className="flex-1 flex flex-col gap-2">
                                    <input
                                        name="installmentTerm"
                                        placeholder="Срок рассрочки (мес)"
                                        type="number"
                                        value={form.installmentTerm}
                                        onChange={handleChange}
                                        className="border p-2 w-full rounded focus:ring-2 focus:ring-green-400"
                                    />
                                    <input
                                        name="address"
                                        placeholder="Адрес"
                                        type="text"
                                        value={form.address}
                                        onChange={handleChange}
                                        className="border p-2 w-full rounded focus:ring-2 focus:ring-green-400"
                                    />
                                </div>
                                <div className="flex-1 flex flex-col gap-2">
                                    <input
                                        name="paymentDay"
                                        placeholder="День месяца"
                                        type="number"
                                        value={form.paymentDay}
                                        onChange={handleChange}
                                        className="border p-2 w-full rounded focus:ring-2 focus:ring-green-400"
                                    />
                                    <input
                                        name="firstPaymentAmount"
                                        placeholder="Первоначальный взнос"
                                        type="number"
                                        value={form.firstPaymentAmount}
                                        onChange={handleChange}
                                        className="border p-2 w-full rounded focus:ring-2 focus:ring-green-400"
                                    />
                                </div>
                            </div>
                        )}

                        {error && <div className="text-red-600 font-medium text-sm">{error}</div>}

                        <div className="flex justify-end gap-3 mt-2">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition">Отмена</button>
                            <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                                {loading ? "Создание..." : "Создать"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {showPlan && planSummary && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg max-h-[80vh] flex flex-col animate-fade-in">
                        <div className="p-6 flex-1 flex flex-col overflow-hidden">
                            <h3 className="text-xl font-semibold mb-4 text-center">План платежей</h3>
                            <p className="text-center text-sm text-gray-600 mb-3">
                                После первоначального взноса {parseFloat(form.firstPaymentAmount || 0).toLocaleString()} сом
                                клиент оплачивает остаток {planSummary.totalAfterDown.toLocaleString()} сом
                            </p>

                            <div className="flex-1 overflow-y-auto border rounded">
                                <table className="w-full border text-sm">
                                    <thead className="bg-gray-100 sticky top-0 z-10">
                                        <tr>
                                            <th className="border p-2">Месяц</th>
                                            <th className="border p-2">Дата</th>
                                            <th className="border p-2">Сумма (сом)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {planSummary.payments.map((p, i) => (
                                            <tr key={i}>
                                                <td className="border p-2 capitalize">{p.plan_date.toLocaleString("ru", { month: "long" })}</td>
                                                <td className="border p-2">{p.plan_date.toLocaleDateString()}</td>
                                                <td className="border p-2 text-right">{p.plan.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-end gap-3 mt-4">
                                <button onClick={() => setShowPlan(false)} className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition">
                                    Назад
                                </button>
                                <button onClick={createClient} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                                    Подтвердить
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
