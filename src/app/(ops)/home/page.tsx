import { redirect } from "next/navigation";

import { getCurrentStaff } from "@/features/harvest";
import { QuickEntryHome } from "@/features/home";

export default async function HomePage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/home");
  return <QuickEntryHome />;
}
