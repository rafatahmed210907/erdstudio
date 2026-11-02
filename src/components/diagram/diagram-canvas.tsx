"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Background,
  BackgroundVariant,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type EdgeTypes,
  type NodeTypes,
} from "@xyflow/react";
import { ArrowUpRight, SlidersHorizontal, ZoomIn, ZoomOut } from "lucide-react";
import { FieldEditor } from "@/components/diagram/field-editor";
import { PropertiesPanel } from "@/components/diagram/properties-panel";
import { RelationEdge, type RelationFlowEdge } from "@/components/diagram/relation-edge";
import { TableNode, type TableFlowNode } from "@/components/diagram/table-node";
import { useStudio } from "@/components/studio-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ENGINE_LABEL, type Cardinality, type Field, type Table } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import "@xyflow/react/dist/style.css";

const nodeTypes: NodeTypes = { table: TableNode };
const edgeTypes: EdgeTypes = { relation: RelationEdge };

export function DiagramCanvas({
  diagramId,
  mode = "full",
  canvasColor,
}: {
  diagramId: string;
  mode?: "full" | "embedded" | "readonly";
  canvasColor?: string;
}) {
  return (
    <ReactFlowProvider>
      <CanvasInner diagramId={diagramId} mode={mode} canvasColor={canvasColor} />
    </ReactFlowProvider>
  );
}

function CanvasInner({
  diagramId,
  mode,
  canvasColor,
}: {
  diagramId: string;
  mode: "full" | "embedded" | "readonly";
  canvasColor?: string;
}) {
  const { snapshot, updateTable, deleteTable, saveRelationship, deleteRelationship, updateDiagram, updateSettings } =
    useStudio();
  const themeName = snapshot?.settings.theme ?? "dark";
  const diagram = snapshot?.diagrams.find((item) => item.id === diagramId) ?? null;
  const settings = snapshot?.settings;
  const interactive = mode === "full";
  const showProperties = mode === "full";
  const dragging = useRef(false);
  const [nodes, setNodes, onNodesChange] = useNodesState<TableFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<RelationFlowEdge>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, setPending] = useState<Connection | null>(null);
  const [label, setLabel] = useState("references");
  const [cardinality, setCardinality] = useState<Cardinality>("1:N");
  const [editing, setEditing] = useState<Table | null>(null);
  const { zoomIn, zoomOut } = useReactFlow();
  const router = useRouter();
  const [zoom, setZoom] = useState(100);
  const [propertiesOpen, setPropertiesOpen] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches,
  );

  const signature = useMemo(() => {
  if (!diagram || !settings) return "";
    return JSON.stringify({
      tables: diagram.tables,
      relationships: diagram.relationships,
      handles: settings.showConnectionHandles,
    });
  }, [diagram, settings]);

  useEffect(() => {
    if (!diagram || !settings || dragging.current) return;
    setNodes(
      diagram.tables.map((table) => ({
        id: table.id,
        type: "table" as const,
        position: table.position,
        data: { table, showHandles: settings.showConnectionHandles },
      })),
    );
    setEdges(
      diagram.relationships.map((relationship) => ({
        id: relationship.id,
        source: relationship.fromTableId,
        target: relationship.toTableId,
        sourceHandle: `${relationship.fromFieldId}:out`,
        targetHandle: `${relationship.toFieldId}:in`,
        type: "relation" as const,
        label: relationship.label,
        data: { cardinality: relationship.cardinality },
        style: { stroke: "#7dd3fc", strokeWidth: 1.6 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#7dd3fc", width: 16, height: 16 },
      })),
    );
  }, [diagram, setEdges, setNodes, settings, signature]);

  const selected = diagram?.tables.find((table) => table.id === selectedId) ?? null;
  const background =
    canvasColor ??
    (themeName === "light" ? settings?.lightCanvasBackground : settings?.canvasBackground) ??
    "#0b1220";

  if (!diagram || !settings) {
    return <div className="grid h-full place-items-center text-sm text-muted-foreground">Diagram not found.</div>;
  }

  return (
    <div className={cn("relative flex h-full", mode === "embedded" && "min-h-[420px]")}>
      <div className="relative min-w-0 flex-1">
        <div className="absolute left-3 top-3 z-10">
          <Select
            value={diagram.engine}
            disabled={!interactive}
            onValueChange={(engine) => void updateDiagram(diagram.id, { engine: engine as Table["engine"] })}
          >
            <SelectTrigger className="h-8 w-[160px] bg-card/90" aria-label="Database engine">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ENGINE_LABEL).map(([value, name]) => (
                <SelectItem key={value} value={value}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1">
          {mode === "embedded" && (
            <Button
              size="sm"
              className="h-8 gap-1.5 bg-primary px-3 text-primary-foreground shadow-md"
              onClick={() =>
                void updateSettings({ currentDiagramId: diagram.id }).then(() => router.push(`/diagrams/${diagram.id}`))
              }
            >
              Go to board
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          )}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card/90 p-1">
            {showProperties && !propertiesOpen && (
              <button
                type="button"
                className="grid h-7 place-items-center rounded-md px-2 hover:bg-secondary"
                aria-label="Expand table properties"
                aria-expanded={false}
                onClick={() => setPropertiesOpen(true)}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </button>
            )}
            <button className="grid h-7 w-7 place-items-center rounded-md hover:bg-secondary" aria-label="Zoom out" onClick={() => zoomOut()}>
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="w-12 text-center text-[11px]">{zoom}%</span>
            <button className="grid h-7 w-7 place-items-center rounded-md hover:bg-secondary" aria-label="Zoom in" onClick={() => zoomIn()}>
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={(_, node) => setSelectedId(node.id)}
          onPaneClick={() => setSelectedId(null)}
          onNodeDoubleClick={(_, node) => {
            const table = diagram.tables.find((item) => item.id === node.id);
            if (table && interactive) setEditing(structuredClone(table));
          }}
          onNodeDragStart={() => {
            dragging.current = true;
          }}
          onNodeDragStop={(_, node) => {
            dragging.current = false;
            const table = diagram.tables.find((item) => item.id === node.id);
            if (!table) return;
            const sameX = Math.round(table.position.x) === Math.round(node.position.x);
            const sameY = Math.round(table.position.y) === Math.round(node.position.y);
            if (sameX && sameY) return;
            void updateTable(diagram.id, node.id, { position: node.position }).catch(() => undefined);
          }}
          onConnect={(connection) => {
            if (!interactive) return;
            setLabel("references");
            setCardinality("1:N");
            setPending(connection);
          }}
          onNodesDelete={(deleted) => {
            deleted.forEach((node) => void deleteTable(diagram.id, node.id));
          }}
          onEdgesDelete={(deleted) => {
            deleted.forEach((edge) => void deleteRelationship(diagram.id, edge.id));
          }}
          isValidConnection={(connection) => {
            const source = connection.sourceHandle?.replace(":out", "");
            const target = connection.targetHandle?.replace(":in", "");
            return !(connection.source === connection.target && source === target);
          }}
          onMove={(_, viewport) => setZoom(Math.round(viewport.zoom * 100))}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.35}
          maxZoom={1.75}
          nodesDraggable={interactive}
          nodesConnectable={interactive && settings.showConnectionHandles}
          elementsSelectable={interactive}
          snapToGrid={settings.snapToGrid}
          snapGrid={[settings.gridSize, settings.gridSize]}
          deleteKeyCode={interactive ? ["Backspace", "Delete"] : null}
          colorMode={themeName === "light" ? "light" : "dark"}
          style={{ background }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={settings.gridSize}
            size={1}
            color={themeName === "light" ? "#cbd5e1" : "#1e293b"}
          />
          {mode === "full" && settings.showMinimap && <MiniMap pannable zoomable />}
        </ReactFlow>
      </div>
      {showProperties && (
        <PropertiesPanel
          open={propertiesOpen}
          onOpenChange={setPropertiesOpen}
          table={selected}
          onChange={(patch) => {
            if (!selected) return;
            void updateTable(diagram.id, selected.id, patch).catch(() => undefined);
          }}
        />
      )}

      <Dialog open={Boolean(pending)} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New relationship</DialogTitle>
            <DialogDescription>Name the connection and choose how many rows it links.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="rel-label">Label</Label>
              <Input id="rel-label" value={label} onChange={(event) => setLabel(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Cardinality</Label>
              <Select value={cardinality} onValueChange={(value) => setCardinality(value as Cardinality)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1:1">1:1</SelectItem>
                  <SelectItem value="1:N">1:N</SelectItem>
                  <SelectItem value="N:M">N:M</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => {
                if (!pending?.source || !pending.target || !pending.sourceHandle || !pending.targetHandle) return;
                void saveRelationship(diagram.id, {
                  id: crypto.randomUUID(),
                  fromTableId: pending.source,
                  fromFieldId: pending.sourceHandle.replace(":out", ""),
                  toTableId: pending.target,
                  toFieldId: pending.targetHandle.replace(":in", ""),
                  cardinality,
                  label,
                }).then(() => setPending(null));
              }}
            >
              Create relationship
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="w-[min(860px,calc(100%-2rem))]">
          <DialogHeader>
            <DialogTitle>Edit {editing?.name}</DialogTitle>
            <DialogDescription>Update fields, then save them back to the diagram.</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="max-h-[60vh] space-y-3 overflow-auto pr-1">
              <Input
                value={editing.name}
                onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                aria-label="Table name"
              />
              <FieldEditor
                fields={editing.fields}
                engine={editing.engine}
                onChange={(fields: Field[]) => setEditing({ ...editing, fields })}
              />
              <Button
                onClick={() => {
                  void updateTable(diagram.id, editing.id, {
                    name: editing.name,
                    fields: editing.fields,
                    description: editing.description,
                  }).then(() => setEditing(null));
                }}
              >
                Save fields
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
