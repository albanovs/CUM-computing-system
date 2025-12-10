"use client";

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchWarehouse, returnDuty } from "../../../lib/slices/wareSlice";

export default function DutyPage() {
    const dispatch = useDispatch();
    const { list, loading, actionLoading } = useSelector((state) => state.warehouse);

    useEffect(() => {
        if (list.length === 0) dispatch(fetchWarehouse());
    }, [dispatch, list.length]);

    const products = list.filter((item) => item.duty === true);

    if (loading) return <div className="p-4 text-gray-500">Загрузка...</div>;

    return (
        <div className="p-5">
            <h1 className="text-2xl font-bold mb-4">📦 Товары в долг</h1>

            {products.length === 0 ? (
                <div className="text-gray-500">Нет товаров в долг</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border p-2">Модель</th>
                                <th className="border p-2">IMEI</th>
                                <th className="border p-2">Цена</th>
                                <th className="border p-2">Цвет</th>
                                <th className="border p-2">Память</th>
                                <th className="border p-2">Имя</th>
                                <th className="border p-2">Отдел</th>
                                <th className="border p-2">Телефон</th>
                                <th className="border p-2">Дата возврата</th>
                                <th className="border p-2">Комментарий</th>
                                <th className="border p-2">Действия</th>
                            </tr>
                        </thead>

                        <tbody>
                            {products.map((item) => (
                                <tr key={item._id} className="text-center">
                                    <td className="border p-2">{item.phoneModel}</td>
                                    <td className="border p-2">{item.IMEI}</td>
                                    <td className="border p-2">{item.price} {item.currency}</td>
                                    <td className="border p-2">{item.color}</td>
                                    <td className="border p-2">{item.storage}</td>
                                    <td className="border p-2">{item.dutyDetail?.name || "—"}</td>
                                    <td className="border p-2">{item.dutyDetail?.department || "—"}</td>
                                    <td className="border p-2">{item.dutyDetail?.PhoneNumber || "—"}</td>
                                    <td className="border p-2">
                                        {item.dutyDetail?.data_register
                                            ? new Date(item.dutyDetail.data_register).toLocaleString("ru-RU", {
                                                dateStyle: "short",
                                                timeStyle: "short",
                                            })
                                            : "—"}
                                    </td>
                                    <td className="border p-2">{item.dutyDetail?.comment || "—"}</td>
                                    <td className="border p-2">
                                        <button
                                            onClick={() => dispatch(returnDuty(item._id))}
                                            disabled={actionLoading === item._id}
                                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                                        >
                                            {actionLoading === item._id ? "..." : "Вернуть"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>

                    </table>
                </div>
            )}
        </div>
    );
}
