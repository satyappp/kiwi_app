"use client";

import { Download, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LabelActions({ pdfHref }: { pdfHref: string }) {
  return (
    <div className="print:hidden flex flex-wrap justify-center gap-3">
      <Button
        type="button"
        onClick={() => window.print()}
        className="h-11 rounded-xl px-5 font-bold"
      >
        <Printer className="size-4" />
        プリンターで印刷
      </Button>
      <a
        href={pdfHref}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 text-sm font-bold text-kiwi-ink transition hover:bg-muted"
      >
        <Download className="size-4" />
        PDFで保存
      </a>
    </div>
  );
}
