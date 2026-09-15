import { CheckCircle2 } from "lucide-react";
import { NextActionList } from "@/components/operations/next-action-list";
import type { NextOperationAction } from "@/lib/operations/next-action";

function ListIcon() {
  return (
    <span className="grid size-7 shrink-0 place-items-center rounded-full border-[1.5px] border-kiwi/50">
      <svg
        viewBox="0 0 24 24"
        className="size-3.5 text-kiwi"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      >
        <path d="M8 6h12M8 12h12M8 18h12M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
      </svg>
    </span>
  );
}

export function TodayTasks({ nextActions }: { nextActions: NextOperationAction[] }) {
  return (
    <section className="mt-6 px-[7%] pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListIcon />
          <h2 className="text-[clamp(0.95rem,4.4cqw,1.1rem)] font-bold text-kiwi-ink">
            今日のタスク
          </h2>
        </div>
        {nextActions.length > 0 && <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800">{nextActions.length}件</span>}
      </div>

      {nextActions.length > 0 ? <NextActionList actions={nextActions} compact /> : <div className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-4 text-sm text-muted-foreground shadow-[0_6px_18px_-8px_rgba(55,75,35,0.12)]"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-kiwi-pale/45"><CheckCircle2 className="size-[18px] text-kiwi" /></span>現在、確認が必要な作業はありません。</div>}
    </section>
  );
}
