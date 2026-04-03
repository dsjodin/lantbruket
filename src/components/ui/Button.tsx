interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

const variants = {
  primary: "bg-green-600 text-white hover:bg-green-700 shadow-sm",
  secondary: "bg-stone-200 text-stone-800 hover:bg-stone-300",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "bg-transparent text-stone-600 hover:bg-stone-100",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-lg font-medium transition-all duration-75 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
