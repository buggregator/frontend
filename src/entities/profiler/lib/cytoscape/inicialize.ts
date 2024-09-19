import cytoscape from 'cytoscape';
import type { Core as Cytoscape, ElementsDefinition, EventObjectNode, NodeSingular, Stylesheet } from "cytoscape";
import dagre, { type DagreLayoutOptions } from "cytoscape-dagre";
import type {ProfilerEdge} from "../../types";
import { cytoscapeStyles } from "./config";


type TInitializeProps = {
  elements: ElementsDefinition,
  container: HTMLElement,
  onNodeHover: (edge?: ProfilerEdge, event?: MouseEvent) => void,
}

type TInitialize = (data: TInitializeProps) => () => void;

const formatProfilerEdge = (node?: NodeSingular): ProfilerEdge | undefined => {
  if (!node) {
    return undefined;
  }

  const data = node.data();

  return {
    id: data.id,
    parent: data.name,
    caller: data.caller,
    callee: data.callee,
    cost: data.cost,
  }
}

const initialize: TInitialize = ({
  elements,
  container,
  onNodeHover,
}) => {
  cytoscape.use(dagre);

  const cy: Cytoscape = cytoscape({
    container,
    wheelSensitivity: 0.4,
    elements,
    layout: {
      name: "dagre",
      nodeSep: 10,
      edgeSep: 10,
      rankSep: 80,
      rankDir: "TB",
    } as DagreLayoutOptions,
    style: cytoscapeStyles as Stylesheet[],
  });

  cy.on("mouseover", "node", (event: EventObjectNode) => {
    onNodeHover(formatProfilerEdge(event.target), event.originalEvent);
  });

  cy.on("mouseout", "node", () => {
    onNodeHover(undefined, undefined);
  });

  return () => cy.destroy();
}

export {
  initialize,
};
