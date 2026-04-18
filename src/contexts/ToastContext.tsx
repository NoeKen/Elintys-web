"use client";

import {
  createContext,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import * as RadixToast from "@radix-ui/react-toast";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "destructive";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  toast: (options: Omit<Toast, "id">) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const toast = useCallback((options: Omit<Toast, "id">) => {
    const id = String(++counter.current);
    setToasts((prev) => [...prev, { ...options, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      <RadixToast.Provider swipeDirection="right">
        {children}
        {toasts.map((t) => (
          <RadixToast.Root
            key={t.id}
            className={cn(
              "flex flex-col gap-1 rounded-lg border p-4 shadow-ambient",
              "bg-surface text-on-surface",
              t.variant === "destructive" && "border-destructive/30 bg-destructive/5",
              t.variant === "success" && "border-success/30 bg-success/5"
            )}
          >
            <RadixToast.Title className="text-sm font-semibold">{t.title}</RadixToast.Title>
            {t.description && (
              <RadixToast.Description className="text-sm text-on-surface-variant">
                {t.description}
              </RadixToast.Description>
            )}
          </RadixToast.Root>
        ))}
        <RadixToast.Viewport className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}
