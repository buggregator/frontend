import { Centrifuge } from 'centrifuge';
import { WS_URL } from './constants';
import { logger } from './logger';

type TUseCentrifuge = () => {
  centrifuge: Centrifuge;
};

class WSConnection {
  private readonly centrifuge: Centrifuge;

  private static instance: WSConnection;

  private constructor() {
    this.centrifuge = new Centrifuge(WS_URL);

    this.centrifuge.on(
      'connected',
      (ctx) => {
        logger(['connected', ctx]);
      },
    );

    this.centrifuge.on(
      'publication',
      (ctx) => {
        logger(['publication', ctx]);
      },
    );

    this.centrifuge.on(
      'disconnected',
      (ctx) => {
        logger(['disconnected', ctx]);
      },
    );

    this.centrifuge.on(
      'error',
      (ctx) => {
        logger(['error', ctx]);
      },
    );

    this.centrifuge.connect();
  }

  public static getInstance(): WSConnection {
    WSConnection.instance ||= new WSConnection();

    return WSConnection.instance;
  }

  public getCentrifuge() {
    return this.centrifuge;
  }
}

export const useCentrifuge: TUseCentrifuge = () => ({
  centrifuge: WSConnection.getInstance().getCentrifuge(),
});
