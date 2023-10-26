import { ServerEvent } from "~/config/types";

export type LoggerParams = [string, unknown]

export interface ApiConnection {
  loggerCb?: (params: LoggerParams) => void
}
