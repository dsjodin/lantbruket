"use client";

interface FloatingAdvanceButtonProps {
  onClick: () => void;
  disabled: boolean;
}

export default function FloatingAdvanceButton({ onClick, disabled }: FloatingAdvanceButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        fixed bottom-20 right-4 z-30 md:hidden
        w-14 h-14 rounded-full shadow-lg
        flex items-center justify-center
        text-white text-2xl font-bold
        transition-all active:scale-95
        disabled:opacity-40 disabled:cursor-not-allowed
        ${disabled
          ? "bg-stone-400"
          : "bg-green-600 hover:bg-green-700 shadow-green-600/30 animate-[pulseGlow_2s_ease-in-out_infinite]"
        }
      `}
      title="Avsluta kvartal"
    >
      <span className="leading-none">&#x25B6;</span>
    </button>
  );
}
