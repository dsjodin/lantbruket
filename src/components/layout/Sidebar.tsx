"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/spel/oversikt", label: "Översikt", icon: "📊" },
  { href: "/spel/beslut", label: "Beslut", icon: "🎯" },
  { href: "/spel/mark", label: "Mark & Grödor", icon: "🌾" },
  { href: "/spel/djur", label: "Djurhållning", icon: "🐄" },
  { href: "/spel/ekonomi", label: "Ekonomi", icon: "💰" },
  { href: "/spel/stod", label: "EU-stöd", icon: "🇪🇺" },
  { href: "/spel/lan", label: "Lån", icon: "🏦" },
  { href: "/spel/personal", label: "Personal", icon: "👷" },
  { href: "/spel/historik", label: "Historik", icon: "📜" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-56 bg-stone-800 text-stone-200 min-h-screen flex-col">
      <Link href="/" className="px-4 py-4 border-b border-stone-700">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌾</span>
          <span className="font-bold text-lg text-white">Lantbruket</span>
        </div>
      </Link>

      <nav className="flex-1 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-stone-700 text-white font-medium"
                  : "hover:bg-stone-700/50"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-stone-700 text-xs text-stone-400">
        Lantbruket v1.0
      </div>
    </aside>
  );
}
