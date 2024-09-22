import type { Stylesheet } from "cytoscape";

export const cytoscapeStyles: Stylesheet[] = [
  {
    selector: "node",
    style: {
      "background-color": "data(color)",
      content: "data(name)",
      "text-valign": "center",
      "text-outline-width": 0,
      color: "data(textColor)",
      shape: "round-rectangle",
      "padding-top": "10px",
      "padding-left": "10px",
      "padding-right": "10px",
      "padding-bottom": "10px",
      "text-wrap": "wrap",
      width: "label",
      height: "label",
      "border-width": "2px",
      "border-color": "#000",
    },
  },
  {
    selector: "edge",
    style: {
      "line-color": "data(color)",
      "background-color": "data(color)",
      "text-outline-width": "2px",
      width: 2,
      height: "label",
      "target-arrow-shape": "triangle",
      "target-arrow-color": "data(color)",
      content: "data(label)",
      color: "#fff",
      "curve-style": "bezier",
      "taxi-direction": "downward",
      "edge-distances": "node-position",
      "control-point-distance": 5,
    },
  },
];
