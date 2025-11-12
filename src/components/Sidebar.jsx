"use client";

import Link from "next/link";
import { useState } from "react";
import { FiHome, FiBox, FiTag, FiMenu, FiX } from "react-icons/fi";

export function Sidebar() {
    const [open, setOpen] = useState(false);

    const links = [
        { href: "/admin", label: "Главная", icon: <FiHome /> },
        { href: "/admin/products", label: "Товары", icon: <FiBox /> },
        { href: "/admin/categories", label: "Категории", icon: <FiTag /> },
    ];

    return (
        <>
            <button
                onClick={() => setOpen(!open)}
                className="md:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-md shadow-lg"
            >
                {open ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>

            <aside
                className={`fixed md:static top-0 left-0 h-full bg-white shadow-lg flex flex-col transition-transform duration-200 z-40
          ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 w-64`}
            >
                <div className="flex items-center justify-between p-4 border-b">
                    <span className="font-bold text-lg text-gray-700">AdminPanel</span>
                    <button
                        onClick={() => setOpen(false)}
                        className="md:hidden text-gray-600 hover:text-gray-900"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                <nav className="flex flex-col p-2">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 p-3 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                        >
                            {link.icon}
                            <span>{link.label}</span>
                        </Link>
                    ))}
                </nav>
            </aside>

            {open && (
                <div
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 bg-black/40 md:hidden z-30"
                />
            )}
        </>
    );
}
