"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import BottomSheet from "./BottomSheet";

const primaryTabs = [
  { href: "/spel/oversikt", label: "Oversikt", icon: "📊" },
  { href: "/spel/beslut", label: "Beslut", icon: "🎯" },
  { href: "/spel/mark", label: "Mark", icon: "🌾" },
  { href: "/spel/ekonomi", label: "Ekonomi", icon: "💰" },
];

const moreTabs = [
  { href: "/spel/djur", label: "Djurhallning", icon: "🐄" },
  { href: "/spel/stod", label: "EU-stod", icon: "🇪🇺" },
  { href: "/spel/lan", label: "Lan", icon: "🏦" },
  { href: "/spel/personal", label: "Personal", icon: "👷" },
  { href: "/spel/historik", label: "Historik", icon: "📜" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const isMoreActive = moreTabs.some((t) => pathname === t.href);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 md:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch h-16">
          {primaryTabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  isActive
                    ? "text-green-700"
                    : "text-stone-500"
                }`}
              >
                <span className="text-lg leading-none">{tab.icon}</span>
                <span className={`text-[10px] leading-tight ${isActive ? "font-semibold" : ""}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute top-0 w-8 h-0.5 bg-green-600 rounded-b-full" />
                )}
              </Link>
            );
          })}

          {/* More tab */}
          <button
            onClick={() => setShowMore(true)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              isMoreActive ? "text-green-700" : "text-stone-500"
            }`}
          >
            <span className="text-lg leading-none">•••</span>
            <span className={`text-[10px] leading-tight ${isMoreActive ? "font-semibold" : ""}`}>
              Mer
            </span>
          </button>
        </div>
      </nav>

      <BottomSheet isOpen={showMore} onClose={() => setShowMore(false)} title="Mer">
        <div className="space-y-1 pb-2">
          {moreTabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => setShowMore(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-green-50 text-green-700 font-medium"
                    : "text-stone-700 hover:bg-stone-50"
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span className="text-sm">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </BottomSheet>
    </>
  );
}
