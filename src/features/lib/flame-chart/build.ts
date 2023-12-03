import type { FlameChartNode } from "flame-chart-js/dist/types";
import type { ProfilerCost, ProfilerEdge, ProfilerEdges } from "~/src/entities/profiler/types";
import { GraphTypes } from "~/src/shared/types";

type FlameChartData = FlameChartNode & {
  cost: ProfilerCost
}
export const build = (edges: ProfilerEdges, field: GraphTypes): FlameChartData => {
  let walked = [] as ProfilerEdge['callee'][]

  const datum: Record<string, FlameChartData> = {}

  Object.values(edges).forEach((edge) => {
    const parent = edge.caller
    const target = edge.callee

    const duration = (edge.cost[String(field)] || 0) > 0 ? edge.cost[String(field)] / 1_000 : 0
    const start = 0

    if (target && !datum[target]) {
      datum[target] = {
        name: target,
        start,
        duration,
        cost: edge.cost,
        children: []
      }
    }

    if (parent && !datum[parent]) {
      datum[parent] = {
        name: parent,
        start,
        duration,
        cost: edge.cost,
        children: []
      }
    }

    // NOTE: walked skips several targettions (recursion detected), should be fixed
    if (!parent || walked.includes(target)) {
      // console.log(node, target)
      return
    }

    if (datum[parent] && datum[parent].children) {
      const parentChildren = datum[parent].children || []

      const lastChild = parentChildren ? parentChildren[parentChildren.length - 1]: null
      datum[target].start = lastChild ? lastChild.start + lastChild.duration : datum[target].start
    } else {
      datum[target].start += datum[parent].start
    }

    datum[parent].children?.push(datum[target])
    walked.push(target)
  })

  walked = []

  return datum['main()']
}
