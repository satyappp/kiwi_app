"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type BackButtonProps = {
  /** Always navigate here instead of depending on browser history. */
  href?: string;
  /** Where to go when there is no in-app history to pop (e.g. deep link, reload). */
  fallbackHref?: string;
  className?: string;
};

export function BackButton({
  href,
  fallbackHref = "/",
  className,
}: BackButtonProps) {
  const router = useRouter();

  function goBack() {
    if (href) {
      router.push(href);
      return;
    }

    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type="button"
      aria-label="戻る"
      onClick={goBack}
      className={
        "grid size-10 place-items-center rounded-full text-kiwi-ink active:bg-black/5 " +
        (className ?? "")
      }
    >
      <ChevronLeft className="size-6" strokeWidth={2.4} />
    </button>
  );
}
