"use client";

import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { updateClientPayments } from "../lib/slices/clientsSlice";

function ProductModal({ product, onClose }) {
    if (!product) return null;

    const currency = Array.isArray(product.currency)
        ? product.currency[0]
        : product.currency || "СОМ";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{product.phoneModel}</h2>
                    <button onClick={onClose} className="text-xl font-bold hover:text-gray-500">&times;</button>
                </div>
                <p><strong>Память:</strong> {product.storage}</p>
                <p><strong>IMEI:</strong> {product.IMEI}</p>
                <p><strong>Цвет:</strong> {product.color}</p>
                <p><strong>Цена:</strong> {product.price} {currency}</p>
                <p><strong>Валюта:</strong> {currency}</p>
                <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Закрыть</button>
            </div>
        </div>
    );
}

export default function Modal({ data, onClose }) {
    const dispatch = useDispatch();

    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [comment, setComment] = useState("");
    const [error, setError] = useState("");

    const productCurrency = Array.isArray(data.product?.[0]?.currency)
        ? data.product[0].currency[0]
        : data.product?.[0]?.currency || "СОМ";

    const [payments, setPayments] = useState(
        (data.payments || []).map(p => ({ ...p, plan_date: new Date(p.plan_date) }))
    );

    const [remainingAmount, setRemainingAmount] = useState(data.remainingAmount || 0);
    const [loading, setLoading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const isPaidOff = Number(remainingAmount) === 0;

    const getNextPaymentDate = (paymentsArr = payments) => {
        const today = new Date();
        const unpaid = paymentsArr?.filter(p => (p.plan - (p.paid || 0)) > 0);
        if (!unpaid || unpaid.length === 0) return null;
        const next = unpaid.find(p => new Date(p.plan_date) >= today);
        return next ? new Date(next.plan_date) : new Date(unpaid[0].plan_date);
    };

    const [nextPaymentDate, setNextPaymentDate] = useState(getNextPaymentDate());

    useEffect(() => {
        if (!isPaidOff) setNextPaymentDate(getNextPaymentDate());
    }, [payments]);

    const handleSubmit = async () => {
        if (loading) return;

        setLoading(true);
        setError("");

        if (!amount || Number(amount) <= 0) {
            setError("Введите корректную сумму оплаты");
            setLoading(false);
            return;
        }

        if (Number(amount) > remainingAmount) {
            setError(`Сумма платежа (${amount}) превышает остаток (${remainingAmount})`);
            setLoading(false);
            return;
        }

        const paymentsCopy = payments.map(p => ({
            plan_date: new Date(p.plan_date),
            plan: Number(p.plan),
            paid: Number(p.paid) || 0,
            comment: p.comment || "",
            overdueDays: Number(p.overdueDays) || 0,
            currency: productCurrency // ✅ валюта всегда строка
        }));

        let remainingPayment = Number(amount);

        for (let i = 0; i < paymentsCopy.length; i++) {
            const p = paymentsCopy[i];
            const unpaid = p.plan - p.paid;
            if (unpaid <= 0) continue;

            const today = new Date(date);
            const planDate = new Date(p.plan_date);
            const diffDays = Math.floor((today - planDate) / (1000 * 60 * 60 * 24));
            if (diffDays > 0) p.overdueDays = diffDays;

            if (remainingPayment >= unpaid) {
                p.paid += unpaid;
                p.comment = comment;
                remainingPayment -= unpaid;
            } else {
                p.paid += remainingPayment;
                p.comment = comment;
                remainingPayment = 0;
                break;
            }
        }

        const newRemaining = paymentsCopy.reduce((s, p) => s + (p.plan - p.paid), 0);

        try {
            const res = await fetch(`/api/clients/${data._id}/payments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    payments: paymentsCopy,
                    remainingAmount: newRemaining
                }),
            });

            const updated = await res.json();

            if (!res.ok) {
                setError(updated.error || "Ошибка при отправке");
                setLoading(false);
                return;
            }

            const updatedPayments = (updated.payments || []).map(p => ({
                ...p,
                plan_date: new Date(p.plan_date)
            }));

            dispatch(updateClientPayments({
                id: data._id,
                payments: updatedPayments,
                remainingAmount: updated.remainingAmount
            }));

            setPayments(updatedPayments);
            setRemainingAmount(updated.remainingAmount);
            setNextPaymentDate(getNextPaymentDate(updatedPayments));
            setAmount("");
            setDate(new Date().toISOString().slice(0, 10));
            setComment("");

        } catch (err) {
            setError("Ошибка при отправке оплаты");
        } finally {
            setLoading(false);
        }
    };

    const handleReturn = async () => {
        if (loading) return;
        setLoading(true);
        setError("");

        try {
            const product = data.product?.[0];
            if (!product) {
                setError("Нет данных о товаре");
                setLoading(false);
                return;
            }

            const currency = Array.isArray(product.currency)
                ? product.currency[0]
                : product.currency || "СОМ";

            const payload = {
                IMEI: product.IMEI,
                phoneModel: product.phoneModel,
                color: product.color,
                storage: product.storage,
                price: product.price,
                currency, // ✅ валюта строкой
                duty: true,
                dutyDetail: {
                    name: data.name,
                    department: data.employees?.department || "",
                    PhoneNumber: data.phoneNumber,
                    returnDate: new Date(),
                    comment: comment || "",
                },
                comment: "Возврат от клиента"
            };

            const res = await fetch("/api/warehouse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const created = await res.json();

            if (!res.ok) {
                setError(created.error || "Ошибка возврата");
                setLoading(false);
                return;
            }

            await fetch(`/api/clients/${data._id}`, { method: "DELETE" });

            alert("Возврат оформлен. Клиент удалён.");
            onClose();

        } catch (err) {
            console.error(err);
            setError("Ошибка при возврате");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">

                <div className="px-6 py-4 bg-blue-600 text-white flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Данные клиента: {data.name}</h2>
                    <button onClick={onClose} className="text-white text-xl font-bold">&times;</button>
                </div>

                <div className="px-6 py-4 max-h-[70vh] overflow-y-auto space-y-2">

                    <p><strong>Дата покупки:</strong> {data.data_register ? new Date(data.data_register).toLocaleDateString("ru-RU") : "-"}</p>
                    <p><strong>Адрес:</strong> {data.address || '-'}</p>
                    <p><strong>Телефон:</strong> {data.phoneNumber}</p>

                    {data.dopNumber && data.dopNumber.length > 0 && (
                        <div>
                            <strong>Доп. контакты:</strong>
                            <ul className="ml-4 list-disc">
                                {data.dopNumber.map((d, idx) => (
                                    <li key={idx}>{d.name} — {d.phone}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <p><strong>Сотрудник:</strong> {data.employees?.name || '-'}</p>

                    <p><strong>Модель:</strong></p>
                    {data.product?.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <span>{p.phoneModel}</span>
                            <button
                                className="px-2 py-1 bg-gray-200 text-sm rounded"
                                onClick={() => setSelectedProduct(p)}
                            >
                                Подробнее
                            </button>
                        </div>
                    ))}

                    <p><strong>Остаток:</strong> {remainingAmount} {productCurrency}</p>

                    {!isPaidOff && (
                        <p className="mt-2 text-sm">
                            Следующая оплата:{" "}
                            <span className="text-blue-600 font-medium">
                                {nextPaymentDate?.toLocaleDateString("ru-RU")}
                            </span>
                        </p>
                    )}

                    {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

                    {!isPaidOff && (
                        <>
                            <input
                                type="number"
                                placeholder={`Сумма (${productCurrency})`}
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="border p-2 rounded w-full"
                            />

                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="border p-2 rounded w-full"
                            />
                        </>
                    )}

                    <h3 className="text-lg font-semibold mt-3">История оплат</h3>
                    <ul className="overflow-y-scroll h-40 border rounded p-2 bg-gray-50">
                        {payments?.map((p, i) => (
                            <li key={i} className="text-sm p-2 border-b last:border-b-0">
                                План: {p.plan} {p.currency} / Факт: {p.paid} {p.currency}
                                <br />
                                План дата: {p.plan_date.toLocaleDateString("ru-RU")}
                                <br />
                                Просрочка: {p.overdueDays || 0} дн.
                            </li>
                        ))}
                        {!payments?.length && (
                            <li className="text-gray-400 text-center py-2">Оплаты отсутствуют</li>
                        )}
                    </ul>
                </div>

                <div className="px-6 py-4 flex justify-end gap-2 border-t">
                    <button
                        onClick={handleReturn}
                        className="px-4 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600"
                        disabled={loading}
                    >
                        Возврат
                    </button>

                    {!isPaidOff && (
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                            disabled={loading}
                        >
                            {loading ? "..." : "Внести"}
                        </button>
                    )}

                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                        disabled={loading}
                    >
                        Отмена
                    </button>
                </div>

                {selectedProduct && (
                    <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
                )}

            </div>
        </div>
    );
}
