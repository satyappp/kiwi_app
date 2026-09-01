import { AuthForm } from "@/features/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const { created } = await searchParams;
  return (
    <main className="w-full rounded-[2rem] border border-white/70 bg-kiwi-cream/80 p-6 shadow-xl shadow-kiwi-brown/10 backdrop-blur-sm">
      <header className="mb-7 text-center">
        <p className="mb-2 text-4xl" aria-hidden="true">🥝</p>
        <h1 className="text-2xl font-bold text-kiwi-ink">キウイ農園</h1>
        <p className="mt-2 text-sm text-muted-foreground">アカウントにログイン</p>
      </header>
      <AuthForm mode="login" accountCreated={created === "1"} />
      <p className="mt-5 text-center text-xs text-muted-foreground">パスワードを忘れた場合は農園スタッフにご確認ください</p>
    </main>
  );
}
