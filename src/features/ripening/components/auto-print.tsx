"use client";

import { useEffect } from "react";

export function AutoPrint({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) window.print();
    });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return null;
}
