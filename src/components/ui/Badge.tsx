interface BadgeProps {
  children: React.ReactNode;
  color?: "green" | "amber" | "red" | "blue" | "stone";
}

const colors = {
  green: "bg-green-100 text-green-800",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-800",
  blue: "bg-blue-100 text-blue-800",
  stone: "bg-stone-100 text-stone-800",
};

export default function Badge({ children, color = "stone" }: BadgeProps) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}
    >
      {children}
    </span>
  );
}
