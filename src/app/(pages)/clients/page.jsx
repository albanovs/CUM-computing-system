"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
    fetchClients,
    deleteClient,
    updateClient,
    updateClientPayments
} from "@/lib/slices/clientsSlice";
import Modal from "@/components/Modal";
import CreateModal from "@/components/CreateModal";

const PAGE_SIZE = 10;

export default function ReportsPage() {
    const dispatch = useDispatch();
    const { list: clients, loading } = useSelector((state) => state.clients);

    const [search, setSearch] = useState("");
    const [filterYear, setFilterYear] = useState("all");
    const [filterMonth, setFilterMonth] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [selected, setSelected] = useState(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (clients.length === 0) dispatch(fetchClients());
    }, [dispatch, clients.length]);

    const getPaymentStatus = (client) => {
        if (!client.payments || client.payments.length === 0) return { status: "paid", daysLeft: 0 };

        const today = new Date();
        const nextPayment = client.payments.find((p) => p.plan - (p.paid || 0) > 0);
        if (!nextPayment) return { status: "paid", daysLeft: 0 };

        const diffDays = Math.round(
            (new Date(nextPayment.plan_date) - new Date(today.getFullYear(), today.getMonth(), today.getDate())) /
            (1000 * 60 * 60 * 24)
        );

        if (diffDays < 0) return { status: "overdue", daysLeft: -diffDays };
        if (diffDays === 0) return { status: "today", daysLeft: 0 };
        if (diffDays === 1) return { status: "tomorrow", daysLeft: 1 };
        return { status: "future", daysLeft: diffDays };
    };

    const filtered = useMemo(() => {
        let filteredData = clients.filter((c) => {
            if (search.trim()) {
                const s = search.toLowerCase();
                if (!c.name?.toLowerCase().includes(s) && !c.code?.toLowerCase().includes(s) && !c.id?.toString().includes(search)) return false;
            }
            if (filterYear !== "all") {
                const year = new Date(c.data_register).getFullYear();
                if (year !== Number(filterYear)) return false;
            }
            if (filterMonth !== "all") {
                const month = new Date(c.data_register).getMonth() + 1;
                if (month !== Number(filterMonth)) return false;
            }
            if (filterStatus !== "all") {
                const status = getPaymentStatus(c).status;
                if (status !== filterStatus) return false;
            }
            return true;
        });

        filteredData.sort((a, b) => {
            const priority = { overdue: 1, today: 2, tomorrow: 3, future: 4, paid: 5 };
            const aStatus = getPaymentStatus(a);
            const bStatus = getPaymentStatus(b);
            if (priority[aStatus.status] !== priority[bStatus.status]) return priority[aStatus.status] - priority[bStatus.status];
            return aStatus.daysLeft - bStatus.daysLeft;
        });

        return filteredData;
    }, [clients, search, filterYear, filterMonth, filterStatus]);

    const years = useMemo(() => {
        const setYears = new Set(clients.map((c) => c.data_register ? new Date(c.data_register).getFullYear() : null).filter(Boolean));
        return Array.from(setYears).sort((a, b) => b - a);
    }, [clients]);

    const months = useMemo(() => {
        if (filterYear === "all") return [];
        const year = Number(filterYear);
        const setMonths = new Set(
            clients.map((c) => {
                if (!c.data_register) return null;
                const d = new Date(c.data_register);
                return d.getFullYear() === year ? d.getMonth() + 1 : null;
            }).filter(Boolean)
        );
        return Array.from(setMonths).sort((a, b) => a - b);
    }, [clients, filterYear]);

    const handleDelete = async () => {
        if (!clientToDelete) return;
        await dispatch(deleteClient(clientToDelete._id));
        setDeleteModalOpen(false);
        setClientToDelete(null);
        setCurrentPage(1);
    };

    const handleCreate = (newClient) => {
        dispatch({ type: "clients/addClient", payload: newClient });
        setCreateModalOpen(false);
        setCurrentPage(1);
    };

    const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
    const paginatedClients = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
    const handleNext = () => setCurrentPage((p) => Math.min(p + 1, pageCount));

    const stats = useMemo(() => {
        let todayCount = 0, todaySum = 0;
        let overdueCount = 0, overdueSum = 0, overdueDaysTotal = 0;
        let paidCount = 0, paidSum = 0;

        clients.forEach(c => {
            const { status, daysLeft } = getPaymentStatus(c);
            const remaining = c.remainingAmount || 0;

            if (status === "today") {
                todayCount++;
                todaySum += remaining;
            } else if (status === "overdue") {
                overdueCount++;
                overdueSum += remaining;
                overdueDaysTotal += daysLeft;
            } else if (status === "paid") {
                paidCount++;
                paidSum += remaining;
            }
        });

        const avgOverdueDays = overdueCount ? Math.round(overdueDaysTotal / overdueCount) : 0;

        return {
            today: { count: todayCount, sum: todaySum },
            overdue: { count: overdueCount, sum: overdueSum, avgDays: avgOverdueDays },
            paid: { count: paidCount, sum: paidSum },
            total: clients.length
        };
    }, [clients]);

    return (
        <div className="p-4 md:p-6 text-sm">
            <div className="mb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-r from-blue-400 to-blue-200 text-white p-4 rounded-lg shadow transition-transform">
                    <div className="text-xs uppercase font-semibold">Сегодня к оплате</div>
                    <div className="text-2xl font-bold">{stats.today.count} чел.</div>
                    <div className="text-sm mt-1">Сумма: {stats.today.sum} сом</div>
                </div>
                <div className="bg-gradient-to-r from-red-400 to-red-200 text-white p-4 rounded-lg shadow transition-transform">
                    <div className="text-xs uppercase font-semibold">Просрочено</div>
                    <div className="text-2xl font-bold">{stats.overdue.count} чел.</div>
                    <div className="text-sm mt-1">Сумма: {stats.overdue.sum} сом</div>
                </div>
                <div className="bg-gradient-to-r from-green-400 to-green-200 text-white p-4 rounded-lg shadow transition-transform">
                    <div className="text-xs uppercase font-semibold">Оплачено</div>
                    <div className="text-2xl font-bold">{stats.paid.count} чел.</div>
                    <div className="text-sm mt-1">Сумма: {stats.paid.sum} сом</div>
                </div>
                <div className="bg-gradient-to-r from-gray-400 to-gray-200 text-white p-4 rounded-lg shadow transition-transform">
                    <div className="text-xs uppercase font-semibold">Всего клиентов</div>
                    <div className="text-2xl font-bold">{stats.total}</div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3 items-center">
                <input
                    type="text"
                    placeholder="Поиск по имени, коду, ID"
                    className="border p-2 rounded w-40 md:w-64 focus:ring-2 focus:ring-blue-400 transition"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select
                    value={filterYear}
                    onChange={(e) => { setFilterYear(e.target.value); setFilterMonth("all"); }}
                    className="border p-2 rounded focus:ring-2 focus:ring-blue-400 transition"
                >
                    <option value="all">Все года</option>
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="border p-2 rounded focus:ring-2 focus:ring-blue-400 transition"
                >
                    <option value="all">Все месяцы</option>
                    {months.map((m) => {
                        const monthName = new Date(0, m - 1).toLocaleString("ru-RU", { month: "long" });
                        return <option key={m} value={m}>{monthName}</option>;
                    })}
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border p-2 rounded focus:ring-2 focus:ring-blue-400 transition"
                >
                    <option value="all">Все статусы</option>
                    <option value="overdue">Просрочено</option>
                    <option value="today">Сегодня</option>
                    <option value="tomorrow">Завтра</option>
                    <option value="future">Будущие</option>
                    <option value="paid">Оплачено</option>
                </select>
                <button
                    onClick={() => setCreateModalOpen(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                >
                    Создать
                </button>
            </div>

            <div className="overflow-auto relative min-h-[300px]">
                {loading ? (
                    <div className="animate-pulse p-4 space-y-2">
                        {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                            <div key={i} className="h-6 bg-gray-200 rounded w-full"></div>
                        ))}
                    </div>
                ) : (
                    <table className="w-full table-auto text-xs md:text-sm border-collapse">
                        <thead>
                            <tr className="bg-gray-200 text-[10px] md:text-xs sticky top-0 z-10">
                                <th className="p-1 md:p-2 border">Код</th>
                                <th className="p-1 md:p-2 border">ID</th>
                                <th className="p-1 md:p-2 border">Имя</th>
                                <th className="p-1 md:p-2 border">Номер телефона</th>
                                <th className="p-1 md:p-2 border">Остаток</th>
                                <th className="p-1 md:p-2 border">Дата покупки</th>
                                <th className="p-1 md:p-2 border">Статус оплаты</th>
                                <th className="p-1 md:p-2 border w-40">Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedClients.map((item) => {
                                const { status, daysLeft } = getPaymentStatus(item);
                                let statusText = "", statusClass = "";
                                if (status === "overdue") statusText = `Просрочено ${daysLeft} дн.`, statusClass = "text-red-600 font-bold";
                                else if (status === "today") statusText = "Сегодня", statusClass = "text-yellow-600 font-semibold";
                                else if (status === "tomorrow") statusText = "Завтра", statusClass = "text-yellow-600 font-semibold";
                                else if (status === "future") statusText = `Через ${daysLeft} дн.`;
                                else if (status === "paid") statusText = "Оплачено", statusClass = "text-green-600 font-semibold";

                                return (
                                    <tr key={item._id} className={
                                        status === "paid" ? "bg-green-100" :
                                            status === "overdue" ? "bg-red-100" :
                                                status === "today" ? "bg-yellow-100" :
                                                    status === "tomorrow" ? "bg-yellow-50" : ""
                                    }>
                                        <td className="p-1 md:p-2 border">{item.code}</td>
                                        <td className="p-1 md:p-2 border">{item.id}</td>
                                        <td className="p-1 md:p-2 border">{item.name}</td>
                                        <td className="p-1 md:p-2 border">{item.phoneNumber}</td>
                                        <td className="p-1 md:p-2 border">{item.remainingAmount}</td>
                                        <td className="p-1 md:p-2 border">{item.data_register ? new Date(item.data_register).toLocaleDateString("ru-RU") : "-"}</td>
                                        <td className={`p-1 md:p-2 border ${statusClass}`}>{statusText}</td>
                                        <td className="p-1 md:p-2 border">
                                            <button
                                                onClick={() => setSelected(item)}
                                                className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] mr-1 md:text-xs hover:bg-blue-700 transition"
                                            >
                                                Подробнее
                                            </button>
                                            <button
                                                onClick={() => { setClientToDelete(item); setDeleteModalOpen(true); }}
                                                className="px-2 py-1 bg-red-600 text-white rounded text-[10px] md:text-xs hover:bg-red-700 transition"
                                            >
                                                Удалить
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {!loading && pageCount > 1 && (
                <div className="flex justify-center gap-2 mt-2">
                    <button onClick={handlePrev} disabled={currentPage === 1} className="px-3 py-1 border rounded disabled:opacity-50">Назад</button>
                    <span className="px-2 py-1">{currentPage} / {pageCount}</span>
                    <button onClick={handleNext} disabled={currentPage === pageCount} className="px-3 py-1 border rounded disabled:opacity-50">Вперёд</button>
                </div>
            )}

            {selected && (
                <Modal
                    data={selected}
                    onClose={() => setSelected(null)}
                    onUpdated={(updated) => {
                        if (updated.payments) {
                            dispatch(updateClientPayments({
                                id: updated._id,
                                payments: updated.payments,
                                remainingAmount: updated.remainingAmount
                            }));
                        } else {
                            dispatch(updateClient(updated));
                        }
                    }}
                />
            )}
            {createModalOpen && (
                <CreateModal
                    onClose={() => setCreateModalOpen(false)}
                    onCreated={handleCreate}
                />
            )}
            {deleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
                    <div className="bg-white p-4 rounded shadow max-w-sm w-full">
                        <h3 className="text-lg font-semibold mb-4">Подтверждение удаления</h3>
                        <p className="mb-4">Вы действительно хотите удалить клиента <b>{clientToDelete?.name}</b>?</p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setDeleteModalOpen(false)} className="px-3 py-1 border rounded hover:bg-gray-100 transition">Отмена</button>
                            <button onClick={handleDelete} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition">Удалить</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
