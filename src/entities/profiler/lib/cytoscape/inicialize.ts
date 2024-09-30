import cytoscape, { type NodeDataDefinition } from 'cytoscape';
import type {
  Core as Cytoscape, ElementsDefinition, EventObjectNode, Stylesheet,
} from 'cytoscape';
import dagre, { type DagreLayoutOptions } from 'cytoscape-dagre';
import { cytoscapeStyles } from './config';

interface TInitializeProps {
  elements: ElementsDefinition;
  container: HTMLElement;
  onNodeHover: (data?: NodeDataDefinition, event?: MouseEvent) => void;
}

type TInitialize = (data: TInitializeProps) => () => void;

const initialize: TInitialize = ({
  elements, container, onNodeHover,
}) => {
  cytoscape.use(dagre);

  const cy: Cytoscape = cytoscape({
    container,
    elements,
    layout: {
      edgeSep: 10,
      name: 'dagre',
      nodeSep: 10,
      rankDir: 'TB',
      rankSep: 80,
    } as DagreLayoutOptions,
    style: cytoscapeStyles as Stylesheet[],
    wheelSensitivity: 0.4,
  });

  cy.on(
    'mouseover',
    'node',
    (event: EventObjectNode) => {
      onNodeHover(
        event.target.data(),
        event.originalEvent,
      );
    },
  );

  cy.on(
    'mouseout',
    'node',
    () => {
      onNodeHover(
        undefined,
        undefined,
      );
    },
  );

  return () => cy.destroy();
};

export { initialize };
