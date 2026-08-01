import { AlertCircle } from "lucide-react";
import type { UserFacingError } from "@/shared/lib/user-facing-error";
import { cn } from "@/shared/lib/utils";

interface FormErrorAlertProps {
  error: UserFacingError | string;
  className?: string;
}

export function FormErrorAlert({ error, className }: FormErrorAlertProps) {
  const normalized =
    typeof error === "string" ? { message: error, details: [] } : error;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive",
        className,
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 space-y-1">
        <p className="font-medium leading-5">{normalized.message}</p>
        {normalized.details.length > 0 && (
          <ul className="list-disc space-y-0.5 pl-4 text-xs leading-5">
            {normalized.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        )}
        {normalized.requestId && (
          <p className="text-xs opacity-80">
            Référence à communiquer au soutien : {normalized.requestId}
          </p>
        )}
      </div>
    </div>
  );
}
