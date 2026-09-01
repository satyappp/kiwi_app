import { HarvestForm } from "@/components/harvest/harvest-form";
import { createClient } from "@/lib/supabase/server";

const plots = [
  { id: "plot-a-3", name: "A区画 - 3" },
];

const varieties = [
  { id: "hayward", name: "ヘイワード" },
];

export default async function NewHarvestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentUser = user
    ? {
        id: user.id,
        name:
          user.user_metadata.full_name ??
          user.user_metadata.name ??
          user.email ??
          "ログインユーザー",
      }
    : null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-lg px-4 py-6 sm:px-6">
      <header className="mb-8">
        <h1 className="text-center text-2xl font-bold text-foreground">
          収穫登録
        </h1>
      </header>

      <HarvestForm
        currentUser={currentUser}
        plots={plots}
        varieties={varieties}
      />
    </main>
  );
}
