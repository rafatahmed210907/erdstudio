import { AddRelationshipScreen } from "@/components/diagram/add-relationship-screen";

export const instant = false;

export default async function NewRelationshipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AddRelationshipScreen diagramId={id} />;
}
