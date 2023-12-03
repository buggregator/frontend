import type { LoggerParams } from "./types";

export const logger = (params: LoggerParams) => {
  console.info(`[ApiConnection logger]:Centrifuge "${params[0]}" called with params: "${JSON.stringify(params[1])}"`)
}
