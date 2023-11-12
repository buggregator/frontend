import {formatDuration, humanFileSize} from "~/utils/formats";
import {GraphTypes, ProfilerEdge, ProfilerEdges, TGraphEdge, TGraphNode} from "~/config/types";

function getColorForCallCount(callCount): string {
  if (callCount <= 1) {
    return '#fff'; // Sky Blue for 1 call
  } else if (callCount <= 10) {
    return '#7BC8F6'; // Lighter Sky Blue
  } else if (callCount <= 25) {
    return '#4DA6FF'; // Light Blue
  } else if (callCount <= 50) {
    return '#1A8FFF'; // Brighter Blue
  } else if (callCount <= 75) {
    return '#007FFF'; // Azure Blue
  } else if (callCount <= 100) {
    return '#0059B3'; // Royal Blue
  } else if (callCount <= 250) {
    return '#FFD700'; // Golden
  } else if (callCount <= 500) {
    return '#FFA500'; // Orange
  } else if (callCount <= 750) {
    return '#FF8C00'; // Dark Orange
  } else if (callCount <= 1000) {
    return '#FF4500'; // OrangeRed
  } else if (callCount <= 2500) {
    return '#FF0000'; // Red
  }

  return '#8B0000'; // Dark Red for 1000 to 1750 calls
}

function getColorForPercentCount(percent): string {
  if (percent <= 10) {
    return '#FFFFFF'; // White
  } else if (percent <= 20) {
    return '#f19797'; // Lighter shade towards dark red
  } else if (percent <= 30) {
    return '#d93939'; // Light shade towards dark red
  } else if (percent <= 40) {
    return '#ad1e1e'; // Intermediate lighter shade towards dark red
  } else if (percent <= 50) {
    return '#982525'; // Intermediate shade towards dark red
  } else if (percent <= 60) {
    return '#862323'; // Intermediate darker shade towards dark red
  } else if (percent <= 70) {
    return '#671d1d'; // Darker shade towards dark red
  } else if (percent <= 80) {
    return '#540d0d'; // More towards dark red
  } else if (percent <= 90) {
    return '#340707'; // Almost dark red
  }

  return '#2d0606'; // Dark red
}

function invertHexColor(hex): string {
  // If the first character is a hash, remove it for processing
  hex = hex.replace('#', '');

  // Convert hex to RGB
  let r = parseInt(hex.substr(0, 2), 16);
  let g = parseInt(hex.substr(2, 2), 16);
  let b = parseInt(hex.substr(4, 2), 16);

  // Calculate the YIQ ratio
  let yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

  // Return black for bright colors, white for dark colors
  return (yiq >= 128) ? '#000' : '#fff';
}

const formatValue = (value: number, metric: string): string | number => {
  const metricFormatMap: Record<string, (v: number) => string | number> = {
    p_mu: (a: number): string => `${a}%`,
    p_pmu: (a: number): string => `${a}%`,
    p_cpu: (a: number): string => `${a}%`,
    p_wt: (a: number): string => `${a}%`,
    mu: humanFileSize,
    d_mu: humanFileSize,
    pmu: humanFileSize,
    d_pmu: humanFileSize,
    cpu: formatDuration,
    d_cpu: formatDuration,
    wt: formatDuration,
    d_wt: formatDuration,
  }

  return metricFormatMap[metric]?.(value) || value
}

export const calcGraphData: (
  edges: ProfilerEdges,
  metric: GraphTypes,
  threshold: number,
  minPercent: number
) => ({
  nodes: TGraphNode[],
  edges: TGraphEdge[]
}) =
  (edges: ProfilerEdges, metric: GraphTypes, threshold: number = 1, minPercent: number = 10) => Object.values(edges)
    .reduce((arr, edge: ProfilerEdge, index) => {
      let nodeColor: string = '#fff';
      let nodeTextColor: string = '#000';
      let edgeColor: string = '#fff';
      let edgeLabel: string = edge.cost.ct > 1 ? `${edge.cost.ct}x` : '';

      if (metric === GraphTypes.CALLS) {
        const metricKey: string = `ct`;
        const isImportantNode: boolean = edge.cost[metricKey] >= minPercent;
        if (!isImportantNode) {
          return arr
        }

        nodeColor = getColorForCallCount(edge.cost[metricKey]);
      } else {
        const metricKey: string = `p_${metric}`;
        const isImportantNode: boolean = edge.cost[metricKey] >= minPercent;
        if (!isImportantNode && edge.cost[metricKey] <= threshold) {
          return arr
        }

        nodeColor = isImportantNode ? getColorForPercentCount(edge.cost[metricKey]) : '#fff';
        nodeTextColor = isImportantNode ? invertHexColor(nodeColor) : '#000';

        edgeColor = nodeColor;

        const postfix: string = edge.cost.ct > 1 ? ` [ ${edge.cost.ct}x ]` : '';
        edgeLabel = `${formatValue(edge.cost[metricKey], metricKey)}${postfix}`;
      }


      arr.nodes.push({
        data: {
          id: edge.callee,
          name: edge.callee as string,
          cost: edge.cost,
          color: nodeColor,
          textColor: nodeTextColor
        }
      })

      const hasNodeSource = arr.nodes.find(node => node.data.id === edge.caller);

      if (index > 0 && hasNodeSource) {
        arr.edges.push({
          data: {
            source: edge.caller || '',
            target: edge.callee,
            color: edgeColor,
            label: edgeLabel,
            weight: edge.cost.ct,
          }
        })
      }

      return arr
    }, {
      nodes: [] as TGraphNode[],
      edges: [] as TGraphEdge[]
    });
