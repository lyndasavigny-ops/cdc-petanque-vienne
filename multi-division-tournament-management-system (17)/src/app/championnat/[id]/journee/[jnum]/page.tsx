import JourneeFeuilles from "@/components/JourneeFeuilles";

export const dynamic = "force-dynamic";

export default async function JourneePage({
  params,
}: {
  params: Promise<{ id: string; jnum: string }>;
}) {
  const { id, jnum } = await params;
  return (
    <JourneeFeuilles championshipId={Number(id)} journeeNumero={Number(jnum)} />
  );
}
