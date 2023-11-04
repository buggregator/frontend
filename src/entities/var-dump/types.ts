import { NormalizedEvent } from "~/src/shared/types";

export interface VarDump {
  payload: {
    type: string,
    value: string | number | boolean
  },
  context: {
    timestamp: number,
    cli: {
      command_line: string,
      identifier: string
    },
    source: {
      name: string,
      file: string,
      line: number,
      file_excerpt: boolean
    }
  }
}
