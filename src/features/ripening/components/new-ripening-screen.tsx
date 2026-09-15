import { BackButton } from "@/components/layout/back-button";
import { RipeningForm } from "@/features/ripening/components/ripening-form";
import {
  getCurrentRipeningStaff,
  getRipeningFormOptions,
} from "@/features/ripening/queries";

const JST = "Asia/Tokyo";

function nowInJst() {
  const now = new Date();
  return {
    date: new Intl.DateTimeFormat("en-CA", {
      timeZone: JST,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now),
    time: new Intl.DateTimeFormat("en-GB", {
      timeZone: JST,
      hour: "2-digit",
      minute: "2-digit",
    }).format(now),
  };
}

export async function NewRipeningScreen() {
  // この画面は新規入力に集中させ、進行状況や次回確認は管理タイムラインへ集約する。
  const [options, currentStaff] = await Promise.all([
    getRipeningFormOptions(),
    getCurrentRipeningStaff(),
  ]);
  const { date, time } = nowInJst();

  return (
    <main className="flex-1 px-[7%] pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <header className="relative mb-6 flex h-11 items-center justify-center">
        <div className="absolute -left-2">
          <BackButton href="/home" />
        </div>
        <h1 className="text-[clamp(1.1rem,5cqw,1.35rem)] font-bold text-kiwi-ink">
          追熟・エチレン管理
        </h1>
      </header>

      <section aria-labelledby="start-ripening-title">
        <div className="mb-4">
          <p className="text-xs font-bold tracking-[0.12em] text-kiwi">
            NEW BATCH
          </p>
          <h2 id="start-ripening-title" className="mt-1 text-lg font-bold text-kiwi-ink">
            追熟を開始する
          </h2>
        </div>

        <RipeningForm
          currentStaff={currentStaff}
          options={options}
          defaultDate={date}
          defaultTime={time}
        />
      </section>
    </main>
  );
}
