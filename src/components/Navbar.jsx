"use client";

import { FiBell, FiUser } from "react-icons/fi";

export function Navbar() {
    return (
        <header className="flex items-center justify-between bg-white px-6 py-4 shadow-sm sticky top-0 z-10">
            <h1 className="text-xl font-semibold text-gray-800">Панель управления</h1>
            <div className="flex items-center gap-4">
                <button className="relative text-gray-600 hover:text-gray-800">
                    <FiBell size={20} />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <div className="flex items-center gap-2">
                    <FiUser size={22} className="text-gray-600" />
                    <span className="hidden md:inline font-medium text-gray-700">Администратор</span>
                </div>
            </div>
        </header>
    );
}