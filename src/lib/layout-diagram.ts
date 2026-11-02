import dagre from "@dagrejs/dagre";
import type { Diagram } from "@/lib/data/types";
import { TABLE_NODE_CHROME_HEIGHT, TABLE_NODE_FIELD_ROW_HEIGHT, TABLE_NODE_WIDTH } from "@/lib/diagram/constants";

export function layoutDiagram(diagram: Diagram): Diagram {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: "LR", nodesep: 48, ranksep: 110, marginx: 24, marginy: 24 });

  const sizes = new Map<string, { width: number; height: number }>();
  for (const table of diagram.tables) {
    const size = {
      width: TABLE_NODE_WIDTH,
      height: TABLE_NODE_CHROME_HEIGHT + table.fields.length * TABLE_NODE_FIELD_ROW_HEIGHT,
    };
    sizes.set(table.id, size);
    graph.setNode(table.id, size);
  }
  for (const relationship of diagram.relationships) {
    if (sizes.has(relationship.fromTableId) && sizes.has(relationship.toTableId)) {
      graph.setEdge(relationship.fromTableId, relationship.toTableId);
    }
  }
  dagre.layout(graph);

  return {
    ...diagram,
    tables: diagram.tables.map((table) => {
      const node = graph.node(table.id);
      const size = sizes.get(table.id)!;
      return {
        ...table,
        position: {
          x: Math.round(node.x - size.width / 2),
          y: Math.round(node.y - size.height / 2),
        },
      };
    }),
  };
}
