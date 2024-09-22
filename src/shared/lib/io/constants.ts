// A developer not always has a possibility to configure ENV variables,
// so we need to guess Api and WS connection urls.
const guessWsConnection = (): string => {
  const WS_HOST = window.location.host
  const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss' : 'ws'

  return `${WS_PROTOCOL}://${WS_HOST}/connection/websocket`
}

const guessRestApiConnection = (): string => {
  const API_HOST = window.location.host
  const API_PROTOCOL = window.location.protocol === 'https:' ? 'https' : 'http'

  return `${API_PROTOCOL}://${API_HOST}`
}

export const REST_API_URL =
  (import.meta.env.VITE_EVENTS_REST_API as string) || guessRestApiConnection()
export const WS_URL = (import.meta.env.VITE_EVENTS_WS_API as string) || guessWsConnection()
