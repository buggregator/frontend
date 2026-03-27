import { storeToRefs } from "pinia";
import type {ProfileFlameChart, ProfilerCallGraph, ProfilerTopFunctions, ProfilerSummary, ProfilerComparison} from "@/entities/profiler/types";
import {useProfileStore} from "../../stores";
import type { EventId } from "../../types";
import { REST_API_URL } from "./constants";

type TUseProfilerRequests = () => {
  getTopFunctions: (id: EventId, params?: Record<string, string>) => Promise<ProfilerTopFunctions>
  getCallGraph: (id: EventId, params?: Record<string, string>) => Promise<ProfilerCallGraph>
  getFlameChart: (id: EventId, params?: Record<string, string>) => Promise<ProfileFlameChart[]>
  getSummary: (id: EventId) => Promise<ProfilerSummary>
  compareProfiles: (baseId: EventId, compareId: EventId) => Promise<ProfilerComparison>
}

enum ProfilerPartType {
  FlameChart = 'flame-chart',
  CallGraph = 'call-graph',
  TopFunctions = 'top'
}

export const useProfilerRequests: TUseProfilerRequests = () => {
  const { token } = storeToRefs(useProfileStore())

  const headers = {"X-Auth-Token": token.value }

  const getProfilerPartsRestUrl = ({
    id,
    params,
    type,
  }: {
     id: EventId,
     params?: Record<string, string>,
     type: ProfilerPartType
  }): string  => {
    const url = `${REST_API_URL}/api/profiler/${id}/${type}`

    const searchParams = new URLSearchParams(params).toString()

    return searchParams ? `${url}?${searchParams}` : url
  }

  const getTopFunctions = (id: EventId, params?: Record<string, string>) => fetch(getProfilerPartsRestUrl({ id, params, type: ProfilerPartType.TopFunctions }), { headers })
    .then((response) => response.json())
    .then((response) => {
      if (response) {
        return response
      }

      if (response?.code === 403) {
        console.error('Forbidden')
        return {};
      }

      console.error('Fetch Error')

      return {};
    })

  const getCallGraph = (id: EventId, params?: Record<string, string>) => fetch(getProfilerPartsRestUrl({ id, params, type: ProfilerPartType.CallGraph }), { headers })
    .then((response) => response.json())
    .then((response) => {
      if (response) {
        return response
      }

      if (response?.code === 403) {
        console.error('Forbidden')
        return {};
      }

      console.error('Fetch Error')

      return {};
    })


  const getFlameChart = (id: EventId, params?: Record<string, string>) => fetch(getProfilerPartsRestUrl({ id, params, type: ProfilerPartType.FlameChart }), { headers })
    .then((response) => response.json())
    .then((response) => {
      if (response) {
        return response
      }

      if (response?.code === 403) {
        console.error('Forbidden')
        return [];
      }

      console.error('Fetch Error')

      return [];
    })


  const getSummary = (id: EventId) => fetch(getProfilerPartsRestUrl({ id, type: 'summary' as ProfilerPartType }), { headers })
    .then((response) => response.json())

  const compareProfiles = (baseId: EventId, compareId: EventId) => fetch(
    `${REST_API_URL}/api/profiler/compare?base=${baseId}&compare=${compareId}`,
    { headers },
  ).then((response) => response.json())

  return {
    getTopFunctions,
    getCallGraph,
    getFlameChart,
    getSummary,
    compareProfiles,
  }
}
