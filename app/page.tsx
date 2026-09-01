import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-lg px-4 py-8 sm:px-6">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">キウイ農園</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          利用する機能を選択してください
        </p>
      </header>

      <nav aria-label="農園機能">
        <Link
          href="/harvest/new"
          className="group flex min-h-40 flex-col items-center justify-center gap-4 rounded-2xl border bg-card p-6 text-card-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <span className="flex size-20 items-center justify-center rounded-full bg-primary/5 transition group-hover:bg-primary/10">
            <Image
              src="/assets/icons/svg/harvest.svg"
              width={56}
              height={56}
              alt=""
              aria-hidden="true"
            />
          </span>
          <span className="text-lg font-semibold">収穫登録</span>
        </Link>
      </nav>
    </main>
  );
}
