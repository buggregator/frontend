import { Centrifuge } from "centrifuge";
import { useProfileStore } from "../../stores";
import { createGetToken, followToken } from "./connection-token";
import { WS_URL } from "./constants";
import { guardHandler } from "./guard-handler";
import { logger } from "./logger";

type TUseCentrifuge = () => {
  centrifuge: Centrifuge
}

class WSConnection {
  private readonly centrifuge: Centrifuge;

  private static instance: WSConnection;

  private constructor() {
    // With auth on the server refuses a connect without the token.
    // Created after the router's auth check, so a stored token is loaded.
    const profileStore = useProfileStore();
    this.centrifuge = new Centrifuge(WS_URL, {
      getToken: createGetToken(() => profileStore.token),
    });
    followToken(this.centrifuge, () => profileStore.token);

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
