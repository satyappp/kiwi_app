import { AuthForm } from "@/features/auth";
import { BrandLogo } from "@/components/layout/brand-logo";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ created?: string; next?: string }> }) {
  const { created, next } = await searchParams;
  return (
    <main className="my-auto w-full rounded-3xl border border-white/70 bg-kiwi-cream/80 p-4 shadow-xl shadow-kiwi-brown/10 backdrop-blur-sm sm:p-6">
      <header className="mb-5 text-center sm:mb-7">
        <h1>
          <BrandLogo priority className="mx-auto w-[172px] sm:w-[196px]" />
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">アカウントにログイン</p>
      </header>
      <AuthForm mode="login" accountCreated={created === "1"} nextPath={next} />
      <p className="mt-5 text-center text-xs text-muted-foreground">パスワードを忘れた場合は農園スタッフにご確認ください</p>
    </main>
  );
}
