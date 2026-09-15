"use client";

import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { NextOperationAction } from "@/lib/operations/next-action";

function formatDeadline(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}/${match[2]}/${match[3]}` : value;
}

export function NextActionList({ actions, compact = false, dense = false }: { actions: NextOperationAction[]; compact?: boolean; dense?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const visibleActions = expanded ? actions : actions.slice(0, 3);
  if (actions.length === 0) return <p className="py-2 text-sm text-muted-foreground">現在、確認が必要な作業はありません。</p>;

  return <div className={dense ? "space-y-1.5" : "space-y-2.5"}>
    {visibleActions.map((action, index) => {
      return <Link key={`${action.kind}-${action.href}-${index}`} href={action.href} className={`flex items-center rounded-xl border border-amber-200/80 bg-white/75 transition hover:bg-white active:scale-[0.99] ${dense ? "gap-2.5 px-3 py-2" : compact ? "gap-3 px-3 py-3" : "gap-3 px-4 py-3"}`}>
        <span className="min-w-0 flex-1"><span className="block text-sm leading-5 text-amber-950">{action.message}</span><span className="mt-0.5 block text-xs font-bold text-amber-800">{action.label}</span></span>
        <span className="flex shrink-0 items-center gap-1.5">
          {action.deadline && <span className="whitespace-nowrap text-[11px] font-bold tabular-nums text-amber-900 sm:text-xs">期限 {formatDeadline(action.deadline)}</span>}
          <ArrowRight className="size-4 text-amber-700" />
        </span>
      </Link>;
    })}
    {actions.length > 3 && <button type="button" onClick={() => setExpanded((value) => !value)} className={`flex w-full items-center justify-center gap-1 rounded-xl text-sm font-bold text-amber-800 transition hover:bg-amber-100/60 ${dense ? "h-8" : "h-10"}`}>{expanded ? <>閉じる <ChevronUp className="size-4" /></> : <>もっと見る（残り{actions.length - 3}件）<ChevronDown className="size-4" /></>}</button>}
  </div>;
}
