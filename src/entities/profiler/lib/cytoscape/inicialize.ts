import cytoscape, {type NodeDataDefinition} from 'cytoscape';
import type { Core as Cytoscape, ElementsDefinition, EventObjectNode, Stylesheet } from "cytoscape";
import dagre, { type DagreLayoutOptions } from "cytoscape-dagre";
import { cytoscapeStyles } from "./config";


type TInitializeProps = {
  elements: ElementsDefinition,
  container: HTMLElement,
  onNodeHover: (data?: NodeDataDefinition, event?: MouseEvent) => void,
}

type TInitialize = (data: TInitializeProps) => () => void;

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
    onNodeHover(event.target.data(), event.originalEvent);
  });

  cy.on("mouseout", "node", () => {
    onNodeHover(undefined, undefined);
  });

  return () => cy.destroy();
}

export {
  initialize,
};
