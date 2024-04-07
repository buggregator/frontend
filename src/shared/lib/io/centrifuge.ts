import { Centrifuge } from "centrifuge";
import { WS_URL } from "./constants";
import { logger } from "./logger";

type TUseCentrifuge = () => {
  centrifuge: Centrifuge
}

class WSConnection {
  private readonly centrifuge: Centrifuge;

  // eslint-disable-next-line no-use-before-define
  private static instance: WSConnection;

  private constructor(token: string | null) {
    this.centrifuge = new Centrifuge(WS_URL);

    this.centrifuge.on('connected', (ctx) => {
      logger(['connected', ctx]);
    });

    this.centrifuge.on('publication', (ctx) => {
      logger(['publication', ctx]);
    });

    this.centrifuge.on('disconnected', (ctx) => {
      logger(['disconnected', ctx]);
    });

    this.centrifuge.on('error', (ctx) => {
      logger(['error', ctx]);
    })

    this.centrifuge.connect();
  }

  public static getInstance(token: string | null): WSConnection {
    if (!WSConnection.instance) {
      WSConnection.instance = new WSConnection(token);
    }

    return WSConnection.instance;
  }

  public getCentrifuge() {
    return this.centrifuge;
  }
}


export const useCentrifuge: TUseCentrifuge = (token: string | null) => ({centrifuge: WSConnection.getInstance(token).getCentrifuge()})
