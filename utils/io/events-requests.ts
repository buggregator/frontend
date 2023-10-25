import { EventId, ServerEvent } from "~/config/types";
import { REST_API_URL } from "./constants";

export const useEventsRequests = () => {
  const getAll = fetch(`${REST_API_URL}/api/events`)
    .then((response) => response.json())
    .then((response) => {
      if (response?.data) {
        return response.data
      }

      console.error('Fetch Error')

      return [];
    })
    .then((events: ServerEvent<unknown>[]) => events)



  const getSingle = (id: EventId) => fetch(`${REST_API_URL}/api/event/${id}`)
    .then((response) => response.json())
    .then((response) => {
      if (response?.data) {
        return response.data as ServerEvent<unknown>[]
      }
      return null
    })


  return {
    getAll,
    getSingle
  }
}
