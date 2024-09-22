import { defineStore } from "pinia";
import { ConnectionStatus } from "./types";

export const useConnectionStore = defineStore("connectionStore", {
  state: () => ({
    wsConnectionStatus: ConnectionStatus.DISCONNECTED
  }),
  getters: {
    isConnectedWS({ wsConnectionStatus }) {
      return wsConnectionStatus === ConnectionStatus.CONNECTED;
    }
  },
  actions: {
    setStatus(newStatus: ConnectionStatus) {
      this.wsConnectionStatus = newStatus;
    },
    removeWSConnection() {
      this.setStatus(ConnectionStatus.DISCONNECTED);
    },
    addWSConnection() {
      this.setStatus(ConnectionStatus.CONNECTED);
    }
  }
});
