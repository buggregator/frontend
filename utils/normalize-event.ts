import {
  HttpDump,
  Inspector,
  InspectorTransaction,
  NormalizedEvent,
  RayDump,
  Sentry,
  SMTP,
} from "~/config/types";
import { RAY_EVENT_TYPES } from "~/config/constants";
import { EVENT_TYPES, ServerEvent } from "~/src/shared/types";

export const normalizeFallbackEvent = (event: ServerEvent<unknown>): NormalizedEvent => ({
  id: event.uuid,
  type: 'unknown',
  labels: [event.type],
  origin: null,
  serverName: "",
  date: new Date(event.timestamp * 1000),
  payload: event.payload
})

export const normalizeInspectorEvent = (event: ServerEvent<Inspector>): NormalizedEvent => {
  const transaction = event.payload[0] as InspectorTransaction;

  return {
    id: event.uuid,
    type: EVENT_TYPES.INSPECTOR,
    labels: [EVENT_TYPES.INSPECTOR],
    origin: {name: transaction.host.hostname, ip: transaction.host.ip, os: transaction.host.os},
    serverName: transaction.host.hostname,
    date: new Date(event.timestamp * 1000),
    payload: event.payload
  }
}

export const normalizeHttpDumpEvent = (event: ServerEvent<HttpDump>): NormalizedEvent => ({
  id: event.uuid,
  type: EVENT_TYPES.HTTP_DUMP,
  labels: [EVENT_TYPES.HTTP_DUMP],
  origin: {uri: event.payload.request.uri},
  serverName: event.payload.host,
  date: new Date(event.timestamp * 1000),
  payload: event.payload
})

export const normalizeSentryEvent = (event: ServerEvent<Sentry>): NormalizedEvent => ({
  id: event.uuid,
  type: EVENT_TYPES.SENTRY,
  labels: [EVENT_TYPES.SENTRY, 'exception'],
  origin: {
    logger: event.payload.logger,
    environment: event.payload.environment
  },
  serverName: event.payload.server_name,
  date: new Date(event.timestamp * 1000),
  payload: event.payload
})

export const normalizeSMTPEvent = (event: ServerEvent<SMTP>): NormalizedEvent => ({
  id: event.uuid,
  type: EVENT_TYPES.SMTP,
  labels: [EVENT_TYPES.SMTP],
  origin: null,
  serverName: "",
  date: new Date(event.timestamp * 1000),
  payload: event.payload
})

export const normalizeRayDumpEvent = (event: ServerEvent<RayDump>): NormalizedEvent => {
  const labels = event.payload.payloads
    .filter(payload => payload.type === 'label')
    .map(payload => payload.content.label)

  const typeLabels = event.payload.payloads
    .filter(payload => Object.values(RAY_EVENT_TYPES).includes(payload.type))
    .map(payload => payload.type)

  event.payload.payloads
    .filter(payload => payload.type === 'size')

  const color = event.payload.payloads
    .filter(payload => payload.type === 'color')
    .map(payload => payload.content.color).shift() || 'black'

  const size = event.payload.payloads
    .filter(payload => payload.type === 'size')
    .map(payload => payload.content.size).shift() || 'md'

  return {
    id: event.uuid,
    type: EVENT_TYPES.RAY_DUMP,
    labels: [EVENT_TYPES.RAY_DUMP, ...labels, ...typeLabels].filter((x, i, a) => a.indexOf(x) === i),
    origin: null,
    serverName: "",
    date: new Date(event.timestamp * 1000),
    color,
    size,
    payload: event
  }
}

