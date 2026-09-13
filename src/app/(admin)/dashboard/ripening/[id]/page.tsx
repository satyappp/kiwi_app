import { notFound } from "next/navigation";

import { getRipeningDetail, RipeningDetail } from "@/features/ripening";

export default async function DashboardRipeningDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getRipeningDetail(id);
  if (!data) notFound();

  return <RipeningDetail data={data} />;
}
