import type { LoggerParams } from './types';

const isProduction: boolean = (import.meta.env.VITE_APP_MODE as string) === 'production';

export const logger = (params: LoggerParams): void => {
  if (isProduction) {
    return;
  }

  console.info(
    `[ApiConnection logger]:Centrifuge "${params[0]}" called with params: "${JSON.stringify(params[1])}"`,
  );
};
