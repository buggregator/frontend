import { ServerEvent } from "~/config/types";

export type LoggerParams = [string, unknown]

export interface ApiConnection {
  onEventReceiveCb: (param: ServerEvent<unknown>) => void
  loggerCb?: (params: LoggerParams) => void
}
