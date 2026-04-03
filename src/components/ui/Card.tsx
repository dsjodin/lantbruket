interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  accent?: "green" | "amber" | "blue" | "orange" | "red" | "none";
}

const accents = {
  green: "border-l-4 border-l-green-500",
  amber: "border-l-4 border-l-amber-500",
  blue: "border-l-4 border-l-blue-500",
  orange: "border-l-4 border-l-orange-500",
  red: "border-l-4 border-l-red-500",
  none: "",
};

export default function Card({
  title,
  children,
  className = "",
  accent = "none",
}: CardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-stone-200 p-4 transition-shadow hover:shadow-md ${accents[accent]} ${className}`}
    >
      {title && (
        <h3 className="text-lg font-semibold text-stone-800 mb-3">{title}</h3>
      )}
      {children}
    </div>
  );
}
