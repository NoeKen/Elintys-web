import { Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface Step {
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-8 flex items-center gap-0">
      {steps.map((step, i) => {
        const stepNumber = i + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;

        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors",
                  isCompleted && "bg-accent text-white shadow-card",
                  isActive && "bg-primary text-white shadow-card",
                  !isCompleted && !isActive && "border border-outline-variant text-on-surface-variant bg-white/70"
                )}
              >
                {isCompleted ? <Check size={14} strokeWidth={2.5} /> : stepNumber}
              </div>
              <span
                className={cn(
                  "whitespace-nowrap text-[11px] font-bold",
                  isActive && "text-on-surface",
                  isCompleted && "text-accent",
                  !isCompleted && !isActive && "text-on-surface-variant"
                )}
              >
                {step.label}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div
                className={cn(
                  "mx-2 mb-5 h-[1.5px] w-16 rounded-full transition-colors",
                  isCompleted ? "bg-accent" : "bg-outline-variant"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
