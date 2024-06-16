import { defineStore } from "pinia";
import type { Profile } from "../types";

const STORAGE_KEY = "token";

export const useProfileStore = defineStore("profileStore", {
  state: () => ({
    token: '' as string,
    profile: undefined as Profile | undefined,
  }),
  getters: {
    isAuthenticated(): boolean {
      return this.token !== undefined && this.token !== null && this.token !== "null";
    },
  },
  actions: {
    setToken(token: string): void {
      const app = useNuxtApp()

      this.token = token;
      localStorage?.setItem(STORAGE_KEY, token);
      app.$authToken.token = token;
    },
    setProfile(profile: Profile): void {
      this.profile = profile;
    },
    fetchToken(): void {
      this.setToken(localStorage?.getItem(STORAGE_KEY) || '');
    },
    removeToken(): void {
      this.token = '';
      localStorage?.removeItem(STORAGE_KEY);
    },
  },
});
