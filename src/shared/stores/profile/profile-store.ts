import { defineStore } from "pinia";
import type {TProfile} from "../../types";
import {getStoredToken, removeStoredToken, setStoredToken} from "./local-storage-actions";


export const useProfileStore = defineStore("profileStore", {
  state: () => ({
    token: '' as string,
    profile: undefined as TProfile | undefined,
  }),
  getters: {
    isAuthenticated(): boolean {
      return this.token !== undefined && this.token !== null && this.token !== "null";
    },
  },
  actions: {
    setToken(token: string): void {
      this.token = token;
      setStoredToken(token);
    },
    setProfile(profile: TProfile): void {
      this.profile = profile;
    },
    fetchToken(): void {
      this.setToken(getStoredToken() || '');
    },
    removeToken(): void {
      this.token = '';
      removeStoredToken();
    },
  },
});
