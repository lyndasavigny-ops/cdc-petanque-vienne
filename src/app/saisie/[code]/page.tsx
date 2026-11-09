import ClubSaisie from "@/components/ClubSaisie";

export default async function SaisiePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <ClubSaisie code={code.toUpperCase()} />;
}
