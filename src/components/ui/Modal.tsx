"use client";

import { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="rounded-xl shadow-xl border-0 p-0 backdrop:bg-black/50 backdrop:backdrop-blur-sm max-w-lg w-full animate-[slideUp_200ms_ease-out] md:animate-[fadeIn_150ms_ease-out] fixed bottom-0 md:relative md:bottom-auto md:m-auto"
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-stone-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
