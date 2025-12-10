"use client";

import React, { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import WarehouseModal from "./WarehouseModal";
import {
    fetchWarehouse,
    deleteWarehouseItem,
} from "../../../lib/slices/wareSlice";

export default function WarehousePage() {
    const dispatch = useDispatch();
    const items = useSelector((state) => state.warehouse.list);
    const loading = useSelector((state) => state.warehouse.loading);

    const [search, setSearch] = useState("");
    const [filterModel, setFilterModel] = useState("all");
    const [filterColor, setFilterColor] = useState("all");

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);

    // Pagination
    const PAGE_SIZE = 12;
    const [currentPage, setCurrentPage] = useState(1);

    React.useEffect(() => {
        // Загружаем товары только если их еще нет
        if (items.length === 0) {
            dispatch(fetchWarehouse());
        }
    }, [dispatch, items.length]);


    // Фильтрация
    const filtered = useMemo(() => {
        return items.filter((item) => {
            if (search.trim()) {
                const s = search.toLowerCase();
                if (
                    !item.IMEI?.toLowerCase().includes(s) &&
                    !item.phoneModel?.toLowerCase().includes(s) &&
                    !item.color?.toLowerCase().includes(s)
                )
                    return false;
            }
            if (filterModel !== "all" && item.phoneModel !== filterModel) return false;
            if (filterColor !== "all" && item.color !== filterColor) return false;
            return true;
        });
    }, [items, search, filterModel, filterColor]);

    const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    const uniqueModels = [...new Set(items.map((i) => i.phoneModel))];
    const uniqueColors = [...new Set(items.map((i) => i.color))];

    const handleDelete = async (id) => {
        await dispatch(deleteWarehouseItem(id));
    };

    const selectedItem = editId ? items.find((i) => i._id === editId) : null;

    return (
        <div className="p-3 md:p-5 mb-20 text-xs md:text-sm">
            {/* HEADER + FILTERS */}
            <div className="flex flex-wrap gap-2 mb-3 items-center">
                <input
                    type="text"
                    placeholder="Поиск по IMEI, модели, цвету"
                    className="border p-1 md:p-2 rounded w-44 md:w-64"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <select
                    value={filterModel}
                    onChange={(e) => setFilterModel(e.target.value)}
                    className="border p-1 md:p-2 rounded"
                >
                    <option value="all">Все модели</option>
                    {uniqueModels.map((m) => (
                        <option key={m} value={m}>
                            {m}
                        </option>
                    ))}
                </select>

                <select
                    value={filterColor}
                    onChange={(e) => setFilterColor(e.target.value)}
                    className="border p-1 md:p-2 rounded"
                >
                    <option value="all">Все цвета</option>
                    {uniqueColors.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>

                <button
                    onClick={() => setCreateModalOpen(true)}
                    className="bg-green-600 text-white px-3 md:px-4 py-1 md:py-2 rounded hover:bg-green-700 transition"
                >
                    Добавить товар
                </button>
            </div>

            {/* TABLE */}
            <div className="overflow-auto bg-white">
                {loading ? (
                    <div className="p-4 text-center">Загрузка...</div>
                ) : (
                    <table className="w-full table-auto border-collapse text-xs md:text-sm">
                        <thead>
                            <tr className="bg-gray-100 sticky top-0">
                                <th className="p-2 border">Дата</th>
                                <th className="p-2 border">IMEI</th>
                                <th className="p-2 border">Модель</th>
                                <th className="p-2 border">Цвет</th>
                                <th className="p-2 border">Память</th>
                                <th className="p-2 border">Цена</th>
                                <th className="p-2 border">Валюта</th>
                                <th className="p-2 border">В долг</th>
                                <th className="p-2 border">Комментарий</th>
                                <th className="p-2 border w-36">Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((item) => (
                                <tr key={item._id}>
                                    <td className="p-2 border">
                                        {item.data_register
                                            ? new Date(item.data_register).toLocaleDateString("ru-RU")
                                            : "-"}
                                    </td>
                                    <td className="p-2 border">{item.IMEI}</td>
                                    <td className="p-2 border">{item.phoneModel}</td>
                                    <td className="p-2 border">{item.color}</td>
                                    <td className="p-2 border">{item.storage}</td>
                                    <td className="p-2 border">{item.price}</td>
                                    <td className="p-2 border">{item.currency}</td>
                                    <td className="p-2 border">{item.duty ? "Да" : "Нет"}</td>
                                    <td className="p-2 border">{item.comment}</td>
                                    <td className="p-2 flex border text-center">
                                        <button
                                            onClick={() => setEditId(item._id)}
                                            className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] md:text-xs mr-1"
                                        >
                                            Изменить
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item._id)}
                                            className="px-2 py-1 bg-red-600 text-white rounded text-[10px] md:text-xs"
                                        >
                                            Удалить
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {!loading && pageCount > 1 && (
                <div className="flex justify-center gap-2 mt-3">
                    <button
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        Назад
                    </button>

                    <span className="px-2 py-1">
                        {currentPage} / {pageCount}
                    </span>

                    <button
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, pageCount))}
                        disabled={currentPage === pageCount}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        Вперёд
                    </button>
                </div>
            )}

            {/* CREATE/EDIT MODAL */}
            {(createModalOpen || editId) && (
                <WarehouseModal
                    data={selectedItem}
                    onClose={() => {
                        setCreateModalOpen(false);
                        setEditId(null);
                    }}
                />
            )}
        </div>
    );
}
