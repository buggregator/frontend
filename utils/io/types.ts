export type LoggerParams = [string, unknown]

export interface ApiConnection {
  loggerCb?: (params: LoggerParams) => void
}
