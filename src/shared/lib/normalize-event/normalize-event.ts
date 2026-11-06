import moment from "moment";
import type { NormalizedEvent, ServerEvent } from "../../types";

type Fields<M> = Pick<NormalizedEvent<unknown, M>, 'type' | 'labels'>
  & Partial<Pick<NormalizedEvent<unknown, M>, 'origin' | 'serverName' | 'meta'>>

// The part every event type's normalizer shares: id, date from the
// timestamp, and the «HH:mm:ss» label in front of the type's own labels.
// A type adds its labels, origin and server name; labels pushed afterwards
// land after the time.
export const normalizeEvent = <T, M = unknown>(
  event: ServerEvent<T>,
  { type, labels, origin = null, serverName = "", meta }: Fields<M>,
): NormalizedEvent<T, M> => {
  const date = event.timestamp ? new Date(event.timestamp * 1000) : null

  return {
    id: event.uuid,
    type,
    labels: date ? [moment(date).format("HH:mm:ss"), ...labels] : [...labels],
    origin,
    serverName,
    date,
    payload: event.payload,
    ...(meta === undefined ? {} : { meta }),
  }
}
