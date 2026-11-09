import ResultatsPublic from "@/components/ResultatsPublic";

export const dynamic = "force-dynamic";

export default async function ResultatsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ResultatsPublic id={Number(id)} />;
}
