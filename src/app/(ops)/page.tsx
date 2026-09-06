import { QuickEntryHome } from "@/features/home";
import { getCurrentStaff } from "@/features/harvest";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");
  return <QuickEntryHome />;
}
