import { defineStore } from "pinia";
import {REST_API_URL} from "../../lib/io/constants";
import type {TProfile} from "../../types";
import {getStoredToken, removeStoredToken, setStoredToken} from "./local-storage-actions";


export const useProfileStore = defineStore("profileStore", {
  state: () => ({
    token: '' as string,
    profile: undefined as TProfile | undefined,
  }),
  getters: {
    isAuthenticated(): boolean {
      return !!this.token && this.token !== "null";
    },
  },
  actions: {
    setToken(token: string): void {
      this.token = token;
      setStoredToken(token);
    },
    async getProfile(): Promise<TProfile> {
      // TODO: need to remove fetch out of the store
      const profile = await fetch(`${REST_API_URL}/api/me`, {
        headers: {"X-Auth-Token": this.token || ""}
      })
        .then((response) => {
          if (!response.ok && response.status === 403) {
            this.removeToken();

            // TODO: add toast to show error
            console.error('Auth Error', response.status, response.statusText)

            return new Error('Auth Error')
          }

          return response
        })
        .then((response) => response.json())
        .catch((e) => {
          console.error(e);

          return null
        });

      this.setProfile(profile)

      return profile
    },
    setProfile(profile: TProfile): void {
      this.profile = profile;
    },
    getStoredToken(): string {
      const token = getStoredToken()

      if (token) {
        this.setToken(token);
      }

      return token
    },
    removeToken(): void {
      this.token = '';
      removeStoredToken();
    },
  },
});
