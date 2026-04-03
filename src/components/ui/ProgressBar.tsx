interface ProgressBarProps {
  value: number;
  max?: number;
  color?: "green" | "amber" | "red" | "blue";
  label?: string;
  showPercent?: boolean;
}

const barColors = {
  green: "bg-green-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  blue: "bg-blue-500",
};

export default function ProgressBar({
  value,
  max = 100,
  color = "green",
  label,
  showPercent = false,
}: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div>
      {(label || showPercent) && (
        <div className="flex justify-between text-sm text-stone-600 mb-1">
          {label && <span>{label}</span>}
          {showPercent && <span>{Math.round(percent)}%</span>}
        </div>
      )}
      <div className="w-full bg-stone-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-700 ease-out ${barColors[color]}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
