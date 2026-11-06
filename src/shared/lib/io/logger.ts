import type { LoggerParams } from "./types";

// Vite sets PROD in a production build; VITE_APP_MODE was never set, so every
// WebSocket message was written to the console in production.
const isProduction: boolean = import.meta.env.PROD

export const logger = (params: LoggerParams): void => {
  if (isProduction) {
    return
  }

  console.info(`[ApiConnection logger]:Centrifuge "${params[0]}" called with params: "${JSON.stringify(params[1])}"`)
}
