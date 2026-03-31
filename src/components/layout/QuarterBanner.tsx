"use client";

import { Quarter } from "@/types/enums";

interface QuarterBannerProps {
  quarter: Quarter;
  year: number;
}

const quarterStyles: Record<Quarter, { bg: string; icon: string; color: string }> = {
  [Quarter.Var]: { bg: "bg-green-100", icon: "🌱", color: "text-green-800" },
  [Quarter.Sommar]: { bg: "bg-yellow-100", icon: "☀️", color: "text-yellow-800" },
  [Quarter.Host]: { bg: "bg-orange-100", icon: "🍂", color: "text-orange-800" },
  [Quarter.Vinter]: { bg: "bg-blue-100", icon: "❄️", color: "text-blue-800" },
};

export default function QuarterBanner({ quarter, year }: QuarterBannerProps) {
  const style = quarterStyles[quarter];
  return (
    <div className={`${style.bg} px-4 py-2 rounded-lg flex items-center gap-2`}>
      <span className="text-xl">{style.icon}</span>
      <span className={`font-bold ${style.color}`}>
        {quarter} - År {year}
      </span>
    </div>
  );
}
