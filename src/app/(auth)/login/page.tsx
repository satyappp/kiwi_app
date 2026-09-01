import { AuthForm } from "@/features/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const { created } = await searchParams;
  return (
    <main className="my-auto w-full rounded-3xl border border-white/70 bg-kiwi-cream/80 p-4 shadow-xl shadow-kiwi-brown/10 backdrop-blur-sm sm:p-6">
      <header className="mb-5 text-center sm:mb-7">
        <p className="mb-1.5 text-3xl sm:text-4xl" aria-hidden="true">🥝</p>
        <h1 className="text-xl font-bold text-kiwi-ink sm:text-2xl">キウイ農園</h1>
        <p className="mt-2 text-sm text-muted-foreground">アカウントにログイン</p>
      </header>
      <AuthForm mode="login" accountCreated={created === "1"} />
      <p className="mt-5 text-center text-xs text-muted-foreground">パスワードを忘れた場合は農園スタッフにご確認ください</p>
    </main>
  );
}
