"use client";

import { useCallback, useRef, useState } from "react";

export type ToastVariant = "success" | "danger";
export function useToast() {
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, variant: ToastVariant = "success") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, variant });
    timerRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  return { toast, showToast };
}
