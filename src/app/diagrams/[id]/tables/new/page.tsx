import { AddTableScreen } from "@/components/diagram/add-table-screen";

export const instant = false;

export default async function NewTablePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AddTableScreen diagramId={id} />;
}
