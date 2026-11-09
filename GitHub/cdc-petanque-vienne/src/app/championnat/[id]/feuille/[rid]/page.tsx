import FeuilleViewer from "@/components/FeuilleViewer";

export const dynamic = "force-dynamic";

export default async function FeuillePage({
  params,
}: {
  params: Promise<{ id: string; rid: string }>;
}) {
  const { id, rid } = await params;
  return (
    <FeuilleViewer championshipId={Number(id)} rencontreId={Number(rid)} />
  );
}
