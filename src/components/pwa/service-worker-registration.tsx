"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
      return;
    }

    let registration: ServiceWorkerRegistration | undefined;

    const updateOnFocus = () => {
      void registration?.update();
    };

    void navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((registered) => {
        registration = registered;
        window.addEventListener("focus", updateOnFocus);
      })
      .catch((error: unknown) => {
        console.error("Service worker registration failed", error);
      });

    return () => {
      window.removeEventListener("focus", updateOnFocus);
    };
  }, []);

  return null;
}
