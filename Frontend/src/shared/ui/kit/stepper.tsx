import { cn } from "@/shared/lib/css";
import { Check } from "lucide-react";

type Step = { id: string; title: string };

export function Stepper({
  steps,
  currentStep,
  className,
}: {
  steps: Step[];
  currentStep: number;
  className?: string;
}) {
  return (
    <ol className={cn("flex w-full items-center gap-2", className)}>
      {steps.map((step, index) => {
        const done = index < currentStep;
        const active = index === currentStep;
        return (
          <li key={step.id} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium",
                done && "border-primary bg-primary text-primary-foreground",
                active && !done && "border-primary text-primary",
                !done && !active && "border-muted-foreground/30 text-muted-foreground",
              )}
            >
              {done ? <Check className="size-4" /> : index + 1}
            </div>
            <span
              className={cn(
                "hidden text-sm sm:inline",
                active ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {step.title}
            </span>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-px flex-1",
                  done ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
