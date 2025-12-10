"use client";
import React, { useEffect, useState } from "react";

export default function EmployeesPage() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");

    const loadEmployees = async () => {
        setLoading(true);
        const res = await fetch("/api/employees");
        const data = await res.json();
        setEmployees(data);
        setLoading(false);
    };

    useEffect(() => {
        loadEmployees();
    }, []);

    const addEmployee = async (e) => {
        e.preventDefault();
        const newEmp = {
            name,
            phoneNumber: phone,
            isWorking: true,
            details: [],
        };
        const res = await fetch("/api/employees", {
            method: "POST",
            body: JSON.stringify(newEmp),
        });
        if (res.ok) {
            setName("");
            setPhone("");
            setIsModalOpen(false);
            loadEmployees();
        }
    };

    const toggleWorking = async (emp) => {
        const res = await fetch("/api/employees", {
            method: "PUT",
            body: JSON.stringify({
                id: emp._id,
                isWorking: !emp.isWorking,
            }),
        });
        if (res.ok) loadEmployees();
    };

    const getStats = (emp) => {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();

        let monthClients = 0;
        let monthSum = 0;

        let totalClients = emp.details.length;
        let totalSum = 0;

        emp.details.forEach((d) => {
            const date = new Date(d.client?.date);
            const price = Number(d.client?.price || 0);

            totalSum += price;

            if (date.getMonth() === month && date.getFullYear() === year) {
                monthClients++;
                monthSum += price;
            }
        });

        return {
            monthClients,
            monthSum,
            totalClients,
            totalSum
        };
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex flex-col gap-10 justify-between items-center mb-6">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    + Добавить сотрудника
                </button>
            </div>

            {loading ? (
                <div>Загрузка...</div>
            ) : (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {employees.map((emp) => {
                        const stats = getStats(emp);

                        return (
                            <div
                                key={emp._id}
                                className="p-5 bg-white rounded-2xl shadow hover:shadow-lg transition border border-gray-200"
                            >
                                <h3 className="text-xl font-semibold mb-1">{emp.name}</h3>
                                <p className="text-gray-700 mb-2">{emp.phoneNumber}</p>

                                <span
                                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-3 ${emp.isWorking
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"
                                        }`}
                                >
                                    {emp.isWorking ? "Работает" : "Не работает"}
                                </span>

                                <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border">
                                    <p><strong>Текущий месяц:</strong></p>
                                    <p>Клиентов: <strong>{stats.monthClients}</strong></p>
                                    <p>Заработано: <strong>{stats.monthSum} сом</strong></p>

                                    <div className="mt-2">
                                        <p><strong>За всё время:</strong></p>
                                        <p>Клиентов: <strong>{stats.totalClients}</strong></p>
                                        <p>Заработано: <strong>{stats.totalSum} сом</strong></p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => toggleWorking(emp)}
                                    className={`block w-full mt-3 py-2 rounded-lg text-white font-medium transition ${emp.isWorking
                                        ? "bg-red-500 hover:bg-red-600"
                                        : "bg-green-500 hover:bg-green-600"
                                        }`}
                                >
                                    {emp.isWorking ? "Сделать не работающим" : "Сделать работающим"}
                                </button>

                                <p className="text-xs text-gray-500 mt-3">
                                    Создан: {new Date(emp.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg">
                        <h2 className="text-xl font-semibold mb-4">Добавить сотрудника</h2>

                        <form onSubmit={addEmployee} className="flex flex-col gap-3">
                            <input
                                type="text"
                                placeholder="Имя"
                                className="border p-2 rounded-lg"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Телефон"
                                className="border p-2 rounded-lg"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />

                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    type="button"
                                    className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                                >
                                    Добавить
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
