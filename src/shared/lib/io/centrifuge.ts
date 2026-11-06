import { Centrifuge } from "centrifuge";
import { WS_URL } from "./constants";
import { guardHandler } from "./guard-handler";
import { logger } from "./logger";

type TUseCentrifuge = () => {
  centrifuge: Centrifuge
}

class WSConnection {
  private readonly centrifuge: Centrifuge;

  // eslint-disable-next-line no-use-before-define
  private static instance: WSConnection;

  private constructor() {
    this.centrifuge = new Centrifuge(WS_URL);

    // Every handler is guarded: an exception in one would stop the client
    // for good (centrifuge-js 5.8).
    this.centrifuge.on('connected', guardHandler('connected', (ctx) => {
      logger(['connected', ctx]);
    }));

    this.centrifuge.on('publication', guardHandler('publication', (ctx) => {
      logger(['publication', ctx]);
    }));

    this.centrifuge.on('disconnected', guardHandler('disconnected', (ctx) => {
      logger(['disconnected', ctx]);
    }));

    this.centrifuge.on('error', guardHandler('error', (ctx) => {
      logger(['error', ctx]);
    }))

    this.centrifuge.connect();
  }

  public static getInstance(): WSConnection {
    if (!WSConnection.instance) {
      WSConnection.instance = new WSConnection();
    }

    return WSConnection.instance;
  }

  public getCentrifuge() {
    return this.centrifuge;
  }
}


export const useCentrifuge: TUseCentrifuge = () => ({centrifuge: WSConnection.getInstance().getCentrifuge()})
