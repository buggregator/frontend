import { storeToRefs } from "pinia";
import type {ProfileFlameChart, ProfilerCallGraph, ProfilerTopFunctions} from "@/entities/profiler/types";
import {useProfileStore} from "../../stores";
import type { EventId } from "../../types";
import { REST_API_URL } from "./constants";

type TUseProfilerRequests = () => {
  getTopFunctions: (id: EventId, params?: Record<string, string>) => Promise<ProfilerTopFunctions>
  getCallGraph: (id: EventId, params?: Record<string, string>) => Promise<ProfilerCallGraph>
  getFlameChart: (id: EventId) => Promise<ProfileFlameChart[]>
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


  const getFlameChart = (id: EventId) => fetch(getProfilerPartsRestUrl({ id, type: ProfilerPartType.FlameChart }), { headers })
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


  return {
    getTopFunctions,
    getCallGraph,
    getFlameChart
  }
}
