import ChampionnatManager from "@/components/ChampionnatManager";

export const dynamic = "force-dynamic";

// La protection se fait via l'API (/api/championnats/[id]) qui exige le
// jeton organisateur : sans lui, la page affiche « accès réservé ».
export default async function ChampionnatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChampionnatManager id={Number(id)} />;
}
