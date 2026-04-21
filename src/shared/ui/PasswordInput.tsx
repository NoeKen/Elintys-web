"use client";

import { useState } from "react";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  error?: string;
  showCheckIcon?: boolean;
}

export function PasswordInput({ error, showCheckIcon, className, ...props }: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        className={cn(
          "w-full bg-transparent py-2 pr-10 text-sm text-on-surface",
          "border-0 border-b border-outline-variant",
          "focus:outline-none focus:border-b-2 focus:border-accent",
          "placeholder:text-on-surface-variant transition-colors",
          error && "border-destructive focus:border-destructive",
          className
        )}
        {...props}
      />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {showCheckIcon && !error && (
          <CheckCircle2 size={16} className="text-accent" />
        )}
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="p-1 text-on-surface-variant hover:text-on-surface transition-colors"
          tabIndex={-1}
          aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
