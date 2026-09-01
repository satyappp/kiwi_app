import { AuthForm } from "@/features/auth";

export default function SignupPage() {
  return (
    <main className="w-full rounded-[2rem] border border-white/70 bg-kiwi-cream/80 p-6 shadow-xl shadow-kiwi-brown/10 backdrop-blur-sm">
      <header className="mb-7 text-center">
        <p className="mb-2 text-4xl" aria-hidden="true">🥝</p>
        <h1 className="text-2xl font-bold text-kiwi-ink">アカウント作成</h1>
        <p className="mt-2 text-sm text-muted-foreground">農園コードをお持ちのスタッフ専用</p>
      </header>
      <AuthForm mode="signup" />
    </main>
  );
}
