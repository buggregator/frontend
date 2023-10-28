import cytoscape, { Core as Cytoscape, ElementsDefinition, EventObjectNode, NodeSingular, Stylesheet } from "cytoscape";
import dagre, { DagreLayoutOptions } from "cytoscape-dagre";
import { cytoscapeStyles } from "./config";

cytoscape.use(dagre);

type TInitializeProps = {
  elements: ElementsDefinition,
  container: HTMLElement,
  onNodeHover: (node?: NodeSingular, event?: MouseEvent) => void,
}

type TInitialize = (data: TInitializeProps) => () => void;

const initialize: TInitialize = ({
  elements,
  container,
  onNodeHover,
}) => {
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
    onNodeHover(event.target, event.originalEvent);
  });

  cy.on("mouseout", "node", (event: EventObjectNode) => {
    onNodeHover(undefined, undefined);
  });

  return () => cy.destroy();
}

export {
  initialize,
};
