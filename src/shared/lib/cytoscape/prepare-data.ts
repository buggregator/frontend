import { GraphTypes, ProfilerEdge, ProfilerEdges, TGraphEdge, TGraphNode } from "~/config/types";
import {useFormats} from "../formats";
// TODO: need to move types to FSD structure

const { formatDuration, formatFileSize } = useFormats();
const formatValue = (value: number, metric: string): string | number => {
  const metricFormatMap: Record<string, (v: number) => string|number> = {
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
  threshold: number
) => ({
  nodes: TGraphNode[],
  edges: TGraphEdge[]
}) =
  (edges: ProfilerEdges, metric , threshold = 1) => Object.values(edges)
    .reduce((arr, edge: ProfilerEdge, index) => {
      const metricKey = `p_${metric}`;

      const isImportantNode = edge.cost.p_pmu > 10;

      if (!isImportantNode && edge.cost[metricKey] <= threshold) {
        return arr
      }

      arr.nodes.push({
        data: {
          id: edge.callee,
          name: edge.callee as string,
          cost: edge.cost,
          color: isImportantNode ? '#e74c3c' : '#fff',
          textColor: isImportantNode ? '#fff' : '#000'
        }
      })

      const hasNodeSource = arr.nodes.find(node => node.data.id === edge.caller);

      if (index > 0 && hasNodeSource) {
        const postfix = edge.cost.ct > 1 ? ` - ${edge.cost.ct  }x` : '';

        arr.edges.push({ data: {
            source: edge.caller || '',
            target: edge.callee,
            color: edge.cost.p_pmu > 10 ? '#e74c3c' : '#fff',
            label: `${formatValue(edge.cost[metricKey], metricKey)}${postfix}`
          }})
      }

      return arr
    }, {
      nodes: [] as TGraphNode[],
      edges: [] as TGraphEdge[]
    });
