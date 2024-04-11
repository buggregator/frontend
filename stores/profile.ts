import { defineStore } from "pinia";
import { Profile } from "~/src/shared/types";

const STORAGE_KEY = "token";

export const useProfileStore = defineStore("profileStore", {
  state: () => ({
    token: null,
    profile: null,
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
      this.setToken(localStorage?.getItem(STORAGE_KEY));
    },
    removeToken(): void {
      this.token = null;
      localStorage?.removeItem(STORAGE_KEY);
    },
  },
});
