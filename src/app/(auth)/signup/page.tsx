import { AuthForm } from "@/features/auth";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="my-auto w-full rounded-3xl border border-white/70 bg-kiwi-cream/80 p-4 shadow-xl shadow-kiwi-brown/10 backdrop-blur-sm sm:p-6">
      <header className="mb-5 text-center sm:mb-7">
        <p className="mb-1.5 text-3xl sm:text-4xl" aria-hidden="true">🥝</p>
        <h1 className="text-xl font-bold text-kiwi-ink sm:text-2xl">アカウント作成</h1>
        <p className="mt-2 text-sm text-muted-foreground">農園コードをお持ちのスタッフ専用</p>
      </header>
      <AuthForm mode="signup" nextPath={next} />
    </main>
  );
}
