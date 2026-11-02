import { DiagramView } from "@/components/diagram/diagram-view";

export const instant = false;

export default async function DiagramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="h-full">
      <DiagramView diagramId={id} mode="full" />
    </div>
  );
}
