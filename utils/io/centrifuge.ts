import { Centrifuge } from "centrifuge";
import { logger } from "./logger";
import { WS_URL } from "./constants";

export const useCentrifuge = () => {
  const centrifuge = new Centrifuge(WS_URL)

  centrifuge.on('connected', (ctx) => {
    logger(['connected', ctx]);
  });

  centrifuge.on('publication', (ctx) => {
    logger(['publication', ctx]);
  });

  centrifuge.on('disconnected', (ctx) => {
    logger(['disconnected', ctx]);
  });

  centrifuge.connect();

  return { centrifuge }
}
