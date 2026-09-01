import { HarvestForm } from "@/components/harvest/harvest-form";
import { createClient } from "@/lib/supabase/server";

const plots = [
  { id: "plot-a-3", name: "A区画 - 3" },
];

const varieties = [
  { id: "hayward", name: "ヘイワード" },
];

const workers = [
  { id: "worker-ito", name: "伊藤" },
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
    <div className="min-h-screen bg-[#fbfaf3] bg-[url('/assets/backgrounds/phone/kiwi-bg-1179x2556.png')] bg-cover bg-top bg-no-repeat lg:bg-[url('/assets/backgrounds/laptop/kiwi-bg-1440x900.png')] lg:bg-center">
      <main className="mx-auto min-h-screen w-full max-w-lg px-4 py-6 sm:px-6">
        <header className="mb-8">
          <h1 className="text-center text-2xl font-bold text-[#244c23]">
            収穫登録
          </h1>
        </header>

        <HarvestForm
          currentUser={currentUser}
          plots={plots}
          varieties={varieties}
          workers={workers}
        />
      </main>
    </div>
  );
}
