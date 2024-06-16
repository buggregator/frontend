import type { ProfilerEdge, ProfilerEdges } from "~/src/entities/profiler/types";
import { useFormats } from "~/src/shared/lib/formats";
import { GraphTypes } from "~/src/shared/types";
import type { TEdge, TNode } from "./types";

const { formatDuration, formatFileSize } = useFormats();

const getColorForCallCount = (callCount: number) => {
  if (callCount <= 1) {
    return '#fff'; // Sky Blue for 1 call
  }

  if (callCount <= 10) {
    return '#7BC8F6'; // Lighter Sky Blue
  }
  if (callCount <= 25) {
    return '#4DA6FF'; // Light Blue
  }
  if (callCount <= 50) {
    return '#1A8FFF'; // Brighter Blue
  }
  if (callCount <= 75) {
    return '#007FFF'; // Azure Blue
  }
  if (callCount <= 100) {
    return '#0059B3'; // Royal Blue
  }
  if (callCount <= 250) {
    return '#FFD700'; // Golden
  }
  if (callCount <= 500) {
    return '#FFA500'; // Orange
  }
  if (callCount <= 750) {
    return '#FF8C00'; // Dark Orange
  }
  if (callCount <= 1000) {
    return '#FF4500'; // OrangeRed
  }
  if (callCount <= 2500) {
    return '#FF0000'; // Red
  }

  return '#8B0000'; // Dark Red for 1000 to 1750 calls
}
const getColorForPercentCount = (percent: number) => {
  if (percent <= 10) {
    return '#FFFFFF'; // White
  }
  if (percent <= 20) {
    return '#f19797'; // Lighter shade towards dark red
  }
  if (percent <= 30) {
    return '#d93939'; // Light shade towards dark red
  }
  if (percent <= 40) {
    return '#ad1e1e'; // Intermediate lighter shade towards dark red
  }
  if (percent <= 50) {
    return '#982525'; // Intermediate shade towards dark red
  }
  if (percent <= 60) {
    return '#862323'; // Intermediate darker shade towards dark red
  }
  if (percent <= 70) {
    return '#671d1d'; // Darker shade towards dark red
  }
  if (percent <= 80) {
    return '#540d0d'; // More towards dark red
  }
  if (percent <= 90) {
    return '#340707'; // Almost dark red
  }

  return '#2d0606'; // Dark red
}
const invertHexColor = (hexInput: string) => {
  // If the first character is a hash, remove it for processing
  const hex = hexInput.replace('#', '');

  // Convert hex to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate the YIQ ratio
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

  // Return black for bright colors, white for dark colors
  return (yiq >= 128) ? '#000' : '#fff';
}
const formatValue = (value: number, metric: string): string | number => {
  const metricFormatMap: Record<string, (v: number) => string | number> = {
    p_mu: (a: number) => `${a}%`,
    p_pmu: (a: number) => `${a}%`,
    p_cpu: (a: number) => `${a}%`,
    p_wt: (a: number) => `${a}%`,
    mu: formatFileSize,
    d_mu: formatFileSize,
    pmu: formatFileSize,
    d_pmu: formatFileSize,
    cpu: formatDuration,
    d_cpu: formatDuration,
    wt: formatDuration,
    d_wt: formatDuration,
  }

  return metricFormatMap[metric]?.(value) || value
}

export const prepareData: (
  edges: ProfilerEdges,
  metric: GraphTypes,
  threshold: number,
  percent: number
) => ({
  nodes: TNode[],
  edges: TEdge[]
}) =
  (edges: ProfilerEdges, metric, threshold = 1, percent = 10) => Object.values(edges)
    .reduce((arr, edge: ProfilerEdge, index) => {
      let nodeColor = '#fff';
      let nodeTextColor = '#000';
      let edgeColor = '#fff';
      let edgeLabel: string = edge.cost.ct > 1 ? `${edge.cost.ct}x` : '';

      const metricKey: string = metric === GraphTypes.CALLS ? `ct` : `p_${metric}`;
      const isImportantNode: boolean = edge.cost[metricKey] >= percent;
      if (!isImportantNode && edge.cost[metricKey] <= threshold) {
        return arr
      }

      if (metric === GraphTypes.CALLS) {
        nodeColor = getColorForCallCount(edge.cost[metricKey]);
      } else {
        nodeColor = isImportantNode ? getColorForPercentCount(edge.cost[metricKey]) : '#fff';
        nodeTextColor = isImportantNode ? invertHexColor(nodeColor) : '#000';

        edgeColor = nodeColor;

        const postfix: string = edge.cost.ct > 1 ? ` [ ${edge.cost.ct}x ]` : '';
        edgeLabel = `${formatValue(edge.cost[metricKey], metricKey)}${postfix}`;
      }

      arr.nodes.push({
        data: {
          id: edge.id,
          name: edge.callee as string,
          cost: edge.cost,
          color: nodeColor,
          textColor: nodeTextColor
        }
      })

      const hasNodeSource = arr.nodes.find(node => node.data.id === edge.parent);

      if (index > 0 && hasNodeSource) {
        arr.edges.push({
          data: {
            source: edge.parent || '',
            target: edge.id,
            color: edgeColor,
            label: edgeLabel,
            weight: edge.cost.ct,
          }
        })
      }

      return arr
    }, {
      nodes: [] as TNode[],
      edges: [] as TEdge[]
    });
