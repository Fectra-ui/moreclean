"use client";

import { Check, Circle } from "lucide-react";
import { WORKFLOW_STEPS, type WorkflowState } from "@/lib/services/workflow/quoteWorkflow";

interface Props {
  currentState: WorkflowState;
  /** When true, hides adminOnly steps */
  klantView?: boolean;
  /** States that are "dead ends" (no further progress) */
  terminal?: boolean;
}

const TERMINAL_STATES: WorkflowState[] = ["afgewezen", "verlopen"];

export default function WorkflowStepper({ currentState, klantView = false }: Props) {
  const isTerminal = TERMINAL_STATES.includes(currentState);

  if (isTerminal) {
    const label = currentState === "afgewezen" ? "Afgewezen" : "Verlopen";
    const color = "border-red-200 bg-red-50 text-red-700";
    return (
      <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${color}`}>
        {label}
      </div>
    );
  }

  const steps = klantView
    ? WORKFLOW_STEPS.filter((s) => !s.adminOnly)
    : WORKFLOW_STEPS;

  const currentIdx = steps.findIndex((s) => s.key === currentState);

  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const isPast    = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isFuture  = i > currentIdx;

        return (
          <div key={step.key} className="flex gap-3">
            {/* Line + icon column */}
            <div className="flex flex-col items-center">
              <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                isPast    ? "border-emerald-500 bg-emerald-500 text-white" :
                isCurrent ? "border-[#4D7EBA] bg-[#4D7EBA] text-white shadow-[0_0_0_3px_rgba(77,126,186,0.2)]" :
                            "border-[#D8DDE6] bg-white text-[#D8DDE6]"
              }`}>
                {isPast ? (
                  <Check size={13} strokeWidth={2.5} />
                ) : isCurrent ? (
                  <div className="h-2 w-2 rounded-full bg-white" />
                ) : (
                  <Circle size={10} />
                )}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-0.5 flex-1 my-0.5 ${isPast ? "bg-emerald-300" : "bg-[#E8EBF0]"}`}
                  style={{ minHeight: "20px" }}
                />
              )}
            </div>

            {/* Text column */}
            <div className={`pb-4 pt-0.5 ${i === steps.length - 1 ? "pb-0" : ""}`}>
              <p className={`text-sm font-semibold leading-none ${
                isCurrent ? "text-[#4D7EBA]" :
                isPast    ? "text-emerald-700" :
                            "text-[#B0B8C4]"
              }`}>
                {step.label}
              </p>
              {isCurrent && (
                <p className="mt-0.5 text-xs text-[#606774]">{step.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
