import { NewSortingScreen } from "@/features/sorting";

/** Thin route: the sorting feature owns fetching, presentation, and mutations. */
export default async function NewSortingPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const params = await searchParams;
  const returnTo = params.returnTo === "/dashboard" ? "/dashboard" : undefined;
  return <NewSortingScreen returnTo={returnTo} />;
}
