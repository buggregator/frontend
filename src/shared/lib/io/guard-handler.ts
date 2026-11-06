// Wraps a handler of a centrifuge client event. Since centrifuge-js 5.8 an
// exception thrown by an app event handler stops the client: it disconnects
// and does not reconnect, so live events stop until the page is reloaded.
// One bad payload must not do that; the error goes to the console instead.
export const guardHandler =
  <A extends unknown[]>(event: string, handler: (...args: A) => void) =>
  (...args: A): void => {
    try {
      handler(...args)
    } catch (e) {
      console.error(`WebSocket "${event}" handler failed:`, e)
    }
  }
