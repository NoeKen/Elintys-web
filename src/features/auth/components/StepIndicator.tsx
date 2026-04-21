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
    <div className="flex items-center gap-0 mb-8">
      {steps.map((step, i) => {
        const stepNumber = i + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;

        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                  isCompleted && "bg-accent text-white",
                  isActive && "bg-primary text-white",
                  !isCompleted && !isActive && "border-2 border-outline-variant text-on-surface-variant bg-transparent"
                )}
              >
                {isCompleted ? <Check size={14} strokeWidth={2.5} /> : stepNumber}
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium whitespace-nowrap",
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
                  "h-[1.5px] w-16 mx-2 mb-5 rounded-full transition-colors",
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
