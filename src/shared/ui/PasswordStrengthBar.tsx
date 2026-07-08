"use client";

import { cn } from "@/shared/lib/utils";

interface PasswordStrengthBarProps {
  password: string;
}

function getScore(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 20;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[0-9]/.test(password)) score += 20;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;
  return score;
}

type Strength = "faible" | "moyen" | "fort" | "tresFort";

function getStrength(score: number): Strength | null {
  if (score === 0) return null;
  if (score < 40) return "faible";
  if (score < 70) return "moyen";
  if (score < 100) return "fort";
  return "tresFort";
}

const strengthConfig: Record<Strength, { label: string; color: string; segments: number }> = {
  faible: { label: "FAIBLE", color: "bg-terracotta", segments: 1 },
  moyen: { label: "MOYEN", color: "bg-gold", segments: 2 },
  fort: { label: "FORT", color: "bg-sage", segments: 3 },
  tresFort: { label: "TRES FORT", color: "bg-teal", segments: 4 },
};

const strengthTextColor: Record<Strength, string> = {
  faible: "text-terracotta",
  moyen: "text-gold-dark",
  fort: "text-sage",
  tresFort: "text-teal",
};

export function PasswordStrengthBar({ password }: PasswordStrengthBarProps) {
  const score = getScore(password);
  const strength = getStrength(score);

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-[3px] flex-1 rounded-sm transition-colors duration-200",
              strength && i < strengthConfig[strength].segments
                ? strengthConfig[strength].color
                : "bg-outline-variant"
            )}
          />
        ))}
      </div>
      {strength && (
        <p
          className={cn(
            "text-[10px] uppercase tracking-[0.06em]",
            strengthTextColor[strength]
          )}
        >
          FORCE DU MOT DE PASSE : {strengthConfig[strength].label}
        </p>
      )}
    </div>
  );
}
