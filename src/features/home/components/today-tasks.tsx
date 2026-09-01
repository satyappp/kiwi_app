import { ChevronRight, Snowflake, Truck, type LucideIcon } from "lucide-react";

type Task = {
  title: string;
  tag: string;
  time: string;
  icon: LucideIcon;
};

const tasks: Task[] = [
  { title: "冷蔵保管温度を確認する", tag: "冷蔵庫A", time: "11:30", icon: Snowflake },
  { title: "出荷予定を確認する", tag: "本日出荷分", time: "15:00", icon: Truck },
];

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

export function TodayTasks() {
  return (
    <section className="mt-6 px-[7%] pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListIcon />
          <h2 className="text-[clamp(0.95rem,4.4cqw,1.1rem)] font-bold text-kiwi-ink">
            今日のタスク
          </h2>
        </div>
        <button
          type="button"
          className="flex items-center gap-0.5 text-[clamp(0.75rem,3.3cqw,0.85rem)] font-bold text-kiwi"
        >
          すべて見る
          <ChevronRight className="size-3.5" />
        </button>
      </div>

      <ul className="space-y-2.5">
        {tasks.map((task) => (
          <li
            key={task.title}
            className="flex items-center gap-3 rounded-2xl bg-white/80 px-3.5 py-3 shadow-[0_6px_18px_-8px_rgba(55,75,35,0.16)]"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full border-[1.5px] border-kiwi/40 bg-white/70">
              <task.icon className="size-[18px] text-kiwi" strokeWidth={2.2} />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[clamp(0.8rem,3.6cqw,0.95rem)] font-bold leading-tight text-foreground">
                {task.title}
              </p>
              <span className="mt-1 inline-block rounded-md bg-kiwi-tan px-1.5 py-[3px] text-[clamp(0.63rem,2.9cqw,0.72rem)] font-medium leading-none text-kiwi-brown">
                {task.tag}
              </span>
            </div>

            <span className="shrink-0 text-[clamp(0.95rem,4.2cqw,1.1rem)] font-bold tabular-nums text-foreground">
              {task.time}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
