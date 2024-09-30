export interface VarDump {
  payload: {
    label: string | null;
    type: string;
    value: string | number | boolean;
    language?: string | null;
  };
  context: {
    timestamp: number;
    cli?: {
      command_line: string;
      identifier: string;
    };
    request?: {
      identifier?: string;
      method?: string;
      uri?: string;
      controller?: string;
    };
    source: {
      name: string;
      file: string;
      line: number;
      file_excerpt: boolean;
    };
  };
}
