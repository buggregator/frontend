import {humanFileSize, formatDuration} from "~/utils/formats";
import { GraphTypes, ProfilerEdge, ProfilerEdges, TGraphEdge, TGraphNode } from "~/config/types";

const labelsStrigifier = (labels: object): string => Object.entries(labels)
    .map(([label, value]) => `${label}="${value}"`)
    .join(' ')

const formatValue = (value: number, metric: string): string | number => {
  const metricFormatMap: Record<string, (v: number) => string|number> = {
    p_mu: (a: number) => `${a}%`,
    p_pmu: (a: number) => `${a}%`,
    p_cpu: (a: number) => `${a}%`,
    p_wt: (a: number) => `${a}%`,
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

export const addSlashes = (str: string): string => str.replace(/\\/g, '\\\\');

const generateNode = (edge: ProfilerEdge, metric: { field: string, label: string }): string => {
    const parent = addSlashes(edge.caller || '')
    const func = addSlashes(edge.callee || '')

    let label = formatValue(edge.cost[metric.field], metric.label)
    if (edge.cost.ct > 1) {
        label += ` - ${edge.cost.ct}x`
    }

    const labels = {
        label,
    }

    return `    "${parent}" -> "${func}" [ ${labelsStrigifier(labels)} ]\n`
}

export class DigraphBuilder {
    private readonly edges: ProfilerEdges;

    constructor(edges: ProfilerEdges) {
        this.edges = edges
    }

    build(metric = "cpu", threshold = 1) {
        let digram = `
digraph xhprof {
    splines=true;
    overlap=false;
    node [ shape="box" style="rounded" fontname="Arial" margin=0.3 ]
    edge [ fontname="Arial" ]
`

        let metricProps = {field: 'p_cpu', label: 'p_cpu'}
        switch (metric) {
            case 'pmu':
                metricProps = {field: 'p_pmu', label: 'p_pmu'}
                break;
            case 'mu':
                metricProps = {field: 'p_mu', label: 'p_mu'}
                break;
            default:
                break;
        }

        const types = {
            pmu: {
                node: {
                    class: 'pmu',
                },
                edge: {
                    // fontcolor: '#891d1d',
                    color: '#ED96AC',
                },
                nodes: []
            },

            default: {
                node: {
                    class: 'default',
                },
                edge: {
                    color: '#999999',
                },
                nodes: []
            },
        }

        const edges = Object.entries(this.edges)

        // eslint-disable-next-line no-restricted-syntax
        for (const [, edge] of edges) {
            if (!edge.caller || edge.caller.length === 0) {
                // eslint-disable-next-line no-continue
                continue;
            }

            if (edge.cost.p_pmu > 10) {
                types.pmu.nodes.push([edge, metricProps])
            } else if (edge.cost[metricProps.field] >= threshold) {
                types.default.nodes.push([edge, metricProps])
            }
        }

        const nodes = Object.entries(types)

        // eslint-disable-next-line no-restricted-syntax
        for (const [, config] of nodes) {
            digram += `    node [ ${labelsStrigifier(config.node)} ]\n`
            digram += `    edge [ ${labelsStrigifier(config.edge)} ]\n`

            // eslint-disable-next-line no-restricted-syntax
            for (const [n, m] of config.nodes) {
                digram += generateNode(n, m)
            }
        }

        return `${digram} }`
    }
}


export const calcGraphData: (
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
