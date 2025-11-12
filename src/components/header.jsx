"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, Home, Users, File, Box } from "lucide-react";
import Link from "next/link";

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setMenuOpen(false);
    }, [pathname]);

    const tabs = [
        { href: "/", label: "Главная", icon: Home },
        { href: "/cash", label: "Касса", icon: Box },
        { href: "/clients", label: "Клиенты", icon: Users },
        { href: "/reports", label: "Отчеты", icon: File },
        { href: "/warehouse", label: "Склад", icon: Box },
    ];

    return (
        <>
            <nav className="w-full bg-white px-4 md:px-10 py-6 shadow-md fixed top-0 left-0 z-20">
                <div className="max-w-[1440px] mx-auto flex items-center justify-between">
                    <Link href="/" className="font-semibold lg:text-[26px] tracking-wide">
                        База данных
                    </Link>

                    <div className="hidden md:flex items-center gap-6">
                        {tabs.map(({ href, label }) => {
                            const active = pathname === href;
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`transition ${active ? "text-pink-500 font-semibold" : "hover:text-blue-400"}`}
                                >
                                    {label}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-2 md:hidden">
                        <button onClick={() => setMenuOpen(true)}>
                            <Menu className="w-7 h-7" />
                        </button>
                    </div>
                </div>
            </nav>

            {menuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[998]"
                    onClick={() => setMenuOpen(false)}
                />
            )}

            <div
                className={`fixed top-0 right-0 h-full w-64 bg-white text-black z-[999] shadow-lg transform transition-transform duration-300 ${menuOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                <div className="flex justify-between items-center p-4 border-b">
                    <span className="font-semibold text-lg">Меню</span>
                    <button onClick={() => setMenuOpen(false)}>
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <nav className="flex flex-col p-4 space-y-4">
                    {tabs.map(({ href, label }) => {
                        const active = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`transition ${active ? "text-pink-500 font-semibold" : "hover:opacity-80"}`}
                                onClick={() => setMenuOpen(false)}
                            >
                                {label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-around items-center py-2 z-[997]">
                {tabs.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex flex-col items-center transition ${active ? "text-pink-500" : "text-gray-500"}`}
                        >
                            <Icon className="w-6 h-6" />
                            <span className="text-xs">{label}</span>
                        </Link>
                    );
                })}
            </div>
        </>
    );
}
