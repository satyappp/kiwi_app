/**
 * Management surface — the PC dashboard used in the office (収穫分析 / 在庫 /
 * 追熟中 / リマインド …). Desktop-first; a sidebar shell will live here.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-dvh bg-background">{children}</div>;
}
