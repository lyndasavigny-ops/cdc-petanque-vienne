import ChampionnatManager from "@/components/ChampionnatManager";

export default async function ChampionnatPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ code?: string; identifiant?: string }>;
}) {
  const { id } = await params;
  const { code, identifiant } = await searchParams;
  return (
    <ChampionnatManager
      id={Number(id)}
      code={typeof code === "string" ? code : ""}
      identifiant={typeof identifiant === "string" ? identifiant : ""}
    />
  );
}
