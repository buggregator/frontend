import type { Stylesheet } from 'cytoscape';

export const cytoscapeStyles: Stylesheet[] = [
  {
    selector: 'node',
    style: {
      'background-color': 'data(color)',
      'border-color': '#000',
      'border-width': '2px',
      color: 'data(textColor)',
      content: 'data(name)',
      height: 'label',
      'padding-bottom': '10px',
      'padding-left': '10px',
      'padding-right': '10px',
      'padding-top': '10px',
      shape: 'round-rectangle',
      'text-outline-width': 0,
      'text-valign': 'center',
      'text-wrap': 'wrap',
      width: 'label',
    },
  },
  {
    selector: 'edge',
    style: {
      'background-color': 'data(color)',
      color: '#fff',
      content: 'data(label)',
      'control-point-distance': 5,
      'curve-style': 'bezier',
      'edge-distances': 'node-position',
      height: 'label',
      'line-color': 'data(color)',
      'target-arrow-color': 'data(color)',
      'target-arrow-shape': 'triangle',
      'taxi-direction': 'downward',
      'text-outline-width': '2px',
      width: 2,
    },
  },
];
