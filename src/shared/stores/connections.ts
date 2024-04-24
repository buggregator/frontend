import { defineStore } from "pinia";

export enum CONNECTION_STATUSES {
  CONNECTED= "connected",
  DISCONNECTED = "disconnected",
}

export const useConnectionStore = defineStore("connectionStore", {
  state: () => ({
    wsConnectionStatus: CONNECTION_STATUSES.DISCONNECTED,
  }),
  getters: {
    isConnectedWS({ wsConnectionStatus }) {
      return wsConnectionStatus === CONNECTION_STATUSES.CONNECTED;
    }
  },
  actions: {
    setStatus(newStatus: CONNECTION_STATUSES) {
      this.wsConnectionStatus = newStatus;
    },
    removeWSConnection() {
      this.setStatus(CONNECTION_STATUSES.DISCONNECTED)
    },
    addWSConnection() {
      this.setStatus(CONNECTION_STATUSES.CONNECTED)
    }

  },
});
