import Image from "next/image";

export function AppHeader() {
  return (
    <header className="relative flex items-center justify-between px-[7%] pt-[calc(env(safe-area-inset-top)+1rem)] pb-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[170%] bg-gradient-to-b from-kiwi-cream/90 via-kiwi-cream/55 to-transparent" />

      <button
        type="button"
        aria-label="メニューを開く"
        className="relative -ml-1.5 grid size-11 place-items-center rounded-full active:bg-black/5"
      >
        <Image
          src="/assets/icons/png/64/menu.png"
          alt=""
          width={26}
          height={26}
          className="size-[26px]"
        />
      </button>

      <h1 className="relative text-[clamp(1.15rem,5.6cqw,1.4rem)] font-bold tracking-[0.02em] text-kiwi-ink">
        キウイ農園
      </h1>

      <button
        type="button"
        aria-label="お知らせを見る"
        className="relative -mr-1.5 grid size-11 place-items-center rounded-full active:bg-black/5"
      >
        <Image
          src="/assets/icons/png/64/notifications.png"
          alt=""
          width={26}
          height={26}
          className="size-[26px]"
        />
      </button>
    </header>
  );
}
