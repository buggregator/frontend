import { type WatchSource, watch } from "vue";

// The parts of the Centrifuge client the token handling needs.
type TokenClient = {
  state: string
  setToken(token: string): void
  connect(): void
  disconnect(): void
}

// centrifuge-js calls it before a connect with no token and again after the
// server refuses one (code 109), so a reconnect reads the token the store
// holds now. An empty token is a valid answer: with auth off the server
// ignores it and the client connects as before.
export const createGetToken = (readToken: () => string) =>
  async (): Promise<string> => readToken() || ''

// A login or a logout changes who the socket speaks for: the client keeps the
// token it connected with, so it is told the new one and connects again.
// Logout leaves it disconnected; the server would refuse an empty token anyway.
export const followToken = (client: TokenClient, token: WatchSource<string>) =>
  watch(token, (next) => {
    client.setToken(next)

    if (client.state !== 'disconnected') {
      client.disconnect()
    }

    if (next) {
      client.connect()
    }
  })
