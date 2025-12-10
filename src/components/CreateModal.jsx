"use client";

import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchClients } from "../lib/slices/clientsSlice";

export default function CreateModal({ onClose, onCreated }) {
    const dispatch = useDispatch();

    const [form, setForm] = useState({
        code: "",
        name: "",
        phoneNumber: "",
        address: "",
        installmentTerm: "",
        paymentDay: "",
        firstPaymentAmount: "",
        isInstallment: false,
        dopNumber: [{ name: "", phone: "" }],
        comment: "",
        employees: { name: "", price: 0, id: "" },
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPlan, setShowPlan] = useState(false);
    const [planSummary, setPlanSummary] = useState(null);

    const [employeesList, setEmployeesList] = useState([]);
    const [warehouseList, setWarehouseList] = useState([]);
    const [imeiInput, setImeiInput] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        async function loadData() {
            const empRes = await fetch("/api/employees");
            setEmployeesList(await empRes.json());

            const whRes = await fetch("/api/warehouse");
            setWarehouseList(await whRes.json());
        }
        loadData();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const handleDopChange = (index, field, value) => {
        const newDop = [...form.dopNumber];
        newDop[index][field] = value;
        setForm({ ...form, dopNumber: newDop });
    };

    const addDop = () => setForm({ ...form, dopNumber: [...form.dopNumber, { name: "", phone: "" }] });
    const removeDop = (index) => {
        const newDop = [...form.dopNumber];
        newDop.splice(index, 1);
        setForm({ ...form, dopNumber: newDop });
    };

    const handleEmployeeChange = (e) => {
        const emp = employeesList.find(emp => emp._id === e.target.value);
        if (emp) {
            setForm({
                ...form,
                employees: { name: emp.name, price: emp.price ?? 0, id: emp._id }
            });
        } else {
            setForm({ ...form, employees: { name: "", price: 0, id: "" } });
        }
    };

    const handleAddByIMEI = () => {
        const product = warehouseList.find(p => p.IMEI === imeiInput);
        if (!product) {
            alert("Товар с таким IMEI не найден");
            return;
        }
        setSelectedProduct(product);
        setImeiInput("");
    };

    const handleRemoveProduct = () => setSelectedProduct(null);

    // Генерация плана рассрочки
    const generatePlan = () => {
        if (!selectedProduct) return { payments: [], totalAfterDown: 0, currency: "СОМ" };

        const totalPrice = selectedProduct.price || 0;
        const firstPayment = parseFloat(form.firstPaymentAmount) || 0;
        const remaining = totalPrice - firstPayment;
        const term = parseInt(form.installmentTerm) || 1;
        const monthly = remaining / term;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const payments = [];
        for (let i = 0; i < term; i++) {
            const payDate = new Date(today.getFullYear(), today.getMonth() + 1 + i, form.paymentDay);
            payments.push({ plan_date: payDate, plan: Math.round(monthly), paid: 0, comment: "" });
        }

        const currency = Array.isArray(selectedProduct.currency)
            ? selectedProduct.currency[0]
            : selectedProduct.currency || "СОМ";

        return { payments, totalAfterDown: remaining, currency };
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");

        if (!form.name || !form.phoneNumber) {
            setError("Имя и телефон обязательны");
            return;
        }

        if (!selectedProduct) {
            setError("Введите IMEI и выберите товар");
            return;
        }

        if (form.isInstallment) {
            if (!form.installmentTerm || !form.paymentDay) {
                setError("Укажите срок рассрочки и день месяца");
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
            const totalPrice = selectedProduct.price || 0;
            const firstPayment = parseFloat(form.firstPaymentAmount) || 0;

            const currency = Array.isArray(selectedProduct?.currency)
                ? selectedProduct.currency[0]
                : selectedProduct?.currency || "СОМ";

            const body = {
                ...form,
                product: selectedProduct ? [selectedProduct] : [],
                data_register: new Date(),
                payments: [],
                remainingAmount: form.isInstallment ? planSummary?.totalAfterDown : 0,
                firstPaymentAmount: firstPayment,
                currency: currency,
            };

            if (form.isInstallment && planSummary) {
                body.payments = planSummary.payments.map(p => ({
                    ...p,
                    currency: Array.isArray(planSummary.currency) ? planSummary.currency[0] : planSummary.currency,
                }));
                body.remainingAmount = planSummary.totalAfterDown;
            } else {
                body.payments.push({
                    plan_date: new Date(),
                    plan: totalPrice,
                    paid: totalPrice,
                    comment: "Полная оплата",
                    currency: currency,
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

            if (selectedProduct) {
                await fetch(`/api/warehouse/${selectedProduct._id}`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                });
            }

            await dispatch(fetchClients());
            setShowPlan(false);
            setSelectedProduct(null);
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
                <div className={`bg-white w-full max-w-md md:max-w-lg rounded-2xl shadow-xl overflow-auto animate-fade-in ${loading ? "pointer-events-none opacity-60" : ""}`}>
                    <div className="px-6 py-4 bg-green-600 text-white flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Создать клиента</h2>
                        <button onClick={onClose} className="text-white text-xl font-bold hover:text-gray-200" disabled={loading}>&times;</button>
                    </div>

                    <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">

                        {/* Имя, телефон и код */}
                        <div className="flex gap-1">
                            <input name="name" placeholder="Имя" value={form.name} onChange={handleChange} className="border p-2 w-full rounded focus:ring-2 focus:ring-green-400" disabled={loading} />
                            <input name="phoneNumber" placeholder="Номер телефона" value={form.phoneNumber} onChange={handleChange} className="border p-2 w-full rounded focus:ring-2 focus:ring-green-400" disabled={loading} />
                            <input name="code" placeholder="Код" value={form.code} onChange={handleChange} className="border p-2 w-full rounded focus:ring-2 focus:ring-green-400" disabled={loading} />
                        </div>

                        {/* IMEI */}
                        <div className="flex gap-2">
                            <input
                                placeholder="Введите IMEI"
                                value={imeiInput}
                                onChange={(e) => setImeiInput(e.target.value)}
                                className="border p-2 rounded w-full focus:ring-2 focus:ring-green-400"
                                disabled={loading}
                            />
                            <button type="button" onClick={handleAddByIMEI} className="px-3 py-1 bg-blue-600 text-white rounded">Добавить</button>
                        </div>

                        {selectedProduct && (
                            <div className="mt-2 p-2 border rounded bg-gray-50 flex justify-between items-center">
                                <div>
                                    <strong>{selectedProduct.phoneModel}</strong> ({selectedProduct.color})<br />
                                    IMEI: {selectedProduct.IMEI}, Валюта: {Array.isArray(selectedProduct.currency) ? selectedProduct.currency[0] : selectedProduct.currency || "СОМ"}, Цена: {selectedProduct.price}
                                </div>
                                <button type="button" className="px-2 py-1 bg-red-600 text-white rounded" onClick={handleRemoveProduct}>Удалить</button>
                            </div>
                        )}

                        {/* Остальной код формы без изменений */}
                        <div className="flex gap-1">
                            <select value={form.employees.id} onChange={handleEmployeeChange} className="border p-2 w-full rounded focus:ring-2 focus:ring-green-400">
                                <option value="">Выберите сотрудника</option>
                                {employeesList.map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
                            </select>
                            <input
                                name="employee_price"
                                placeholder="Доля сотрудника"
                                type="number"
                                value={form.employees.price ?? ""}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        employees: { ...form.employees, price: parseFloat(e.target.value) || 0 }
                                    })
                                }
                                className="border p-2 w-full rounded focus:ring-2 focus:ring-green-400"
                            />
                        </div>

                        {/* Рассрочка */}
                        <div className="flex items-center space-x-2">
                            <input type="checkbox" name="isInstallment" checked={form.isInstallment} onChange={handleChange} disabled={loading} />
                            <label className="text-sm">Рассрочка</label>
                        </div>

                        {form.isInstallment && (
                            <div className="flex flex-col gap-2">
                                <div className="flex gap-1">
                                    <input name="installmentTerm" placeholder="Срок рассрочки (мес)" type="number" value={form.installmentTerm} onChange={handleChange} className="border p-2 w-full rounded focus:ring-2 focus:ring-green-400" disabled={loading} />
                                    <input name="paymentDay" placeholder="День месяца" type="number" value={form.paymentDay} onChange={handleChange} className="border p-2 w-full rounded focus:ring-2 focus:ring-green-400" disabled={loading} />
                                </div>
                                <div className="flex gap-1">
                                    <input name="firstPaymentAmount" placeholder="Первоначальный взнос" type="number" value={form.firstPaymentAmount} onChange={handleChange} className="border p-2 w-full rounded focus:ring-2 focus:ring-green-400" disabled={loading} />
                                    <input name="address" placeholder="Адрес" type="text" value={form.address} onChange={handleChange} className="border p-2 w-full rounded focus:ring-2 focus:ring-green-400" disabled={loading} />
                                </div>

                                <h2>Дополнительная информация</h2>
                                {form.dopNumber.map((dop, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <input placeholder="Кем приходится" value={dop.name} onChange={(e) => handleDopChange(idx, "name", e.target.value)} className="border p-2 w-full rounded focus:ring-2 focus:ring-green-400" />
                                        <input placeholder="Номер телефона" value={dop.phone} onChange={(e) => handleDopChange(idx, "phone", e.target.value)} className="border p-2 w-full rounded focus:ring-2 focus:ring-green-400" />
                                        {form.dopNumber.length > 1 && <button type="button" className="px-2 py-1 bg-red-600 text-white rounded" onClick={() => removeDop(idx)}>Удалить</button>}
                                    </div>
                                ))}
                                <button type="button" className="px-3 py-1 bg-blue-600 text-white rounded" onClick={addDop}>Добавить</button>
                            </div>
                        )}

                        <textarea
                            name="comment"
                            placeholder="Комментарий"
                            value={form.comment}
                            onChange={handleChange}
                            className="border p-2 w-full rounded focus:ring-2 focus:ring-green-400"
                            rows={2}
                            disabled={loading}
                        />

                        {error && <div className="text-red-600 font-medium text-sm">{error}</div>}

                        <div className="flex justify-end gap-3 mt-2">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition" disabled={loading}>Отмена</button>
                            <button type="submit" disabled={loading} className={`px-4 py-2 rounded-lg text-white transition ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
                                {loading ? "Создание..." : "Создать"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* План платежей */}
            {showPlan && planSummary && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className={`bg-white rounded-2xl shadow-lg w-full max-w-lg max-h-[80vh] flex flex-col animate-fade-in ${loading ? "pointer-events-none opacity-60" : ""}`}>
                        <div className="p-6 flex-1 flex flex-col overflow-hidden">
                            <h3 className="text-xl font-semibold mb-4 text-center">План платежей</h3>
                            <p className="text-center text-sm text-gray-600 mb-3">
                                После первоначального взноса {parseFloat(form.firstPaymentAmount || 0).toLocaleString()} {planSummary.currency}
                                клиент оплачивает остаток {planSummary.totalAfterDown.toLocaleString()} {planSummary.currency}
                            </p>

                            <div className="flex-1 overflow-y-auto border rounded">
                                <table className="w-full border text-sm">
                                    <thead className="bg-gray-100 sticky top-0 z-10">
                                        <tr>
                                            <th className="border p-2">Месяц</th>
                                            <th className="border p-2">Дата</th>
                                            <th className="border p-2 text-right">Сумма ({planSummary.currency})</th>
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
                                <button onClick={() => setShowPlan(false)} className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition" disabled={loading}>Назад</button>
                                <button onClick={createClient} className={`px-4 py-2 rounded-lg text-white transition ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`} disabled={loading}>
                                    {loading ? "Создание..." : "Подтвердить"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
