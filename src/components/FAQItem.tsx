"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

type Props = {
  question: string;
  answer: string;
};

export default function FAQItem({ question, answer }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-5 flex items-center justify-between text-left"
      >
        <span>{question}</span>
        {open ? <Minus size={18} /> : <Plus size={18} />}
      </button>

      {open && (
        <div className="px-5 pb-5 text-white/70">
          {answer}
        </div>
      )}
    </div>
  );
}