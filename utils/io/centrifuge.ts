import { Centrifuge } from "centrifuge";
import { logger } from "./logger";
import { WS_URL } from "./constants";

type TUseCentrifuge = () => {
  centrifuge: Centrifuge
}
export const useCentrifuge: TUseCentrifuge = () => {
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

  centrifuge.on('error', (ctx) => {
    logger(['error', ctx]);
  })

  centrifuge.connect();

  return { centrifuge }
}
