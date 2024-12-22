import {useFormats} from "@/shared/lib/formats";
import type {StatBoardCost} from "../../types";

const { formatDuration, formatFileSize } = useFormats()

export const calcStatItems = (cost: StatBoardCost): Array<{ title: string, value: string, percent?: number }> => {
  return [
    {
      title: 'Calls',
      value: cost.ct ? String(cost.ct) : "0",
      percent: undefined
    },
    {
      title: 'CPU time',
      value: formatDuration(cost.cpu || 0) || '—',
      percent: cost?.p_cpu
    },
    {
      title: 'Wall time',
      value: formatDuration(cost.wt || 0) || '—',
      percent: cost?.p_wt
    },
    {
      title: 'Memory usage',
      value: formatFileSize(cost.mu || 0, 3) || '—',
      percent: cost?.p_mu
    },
    {
      title: 'Peak memory usage',
      value: formatFileSize(cost.pmu || 0, 3) || '—',
      percent: cost?.p_pmu
    }
  ]
}
