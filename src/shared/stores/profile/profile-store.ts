import { defineStore } from "pinia";
import {REST_API_URL} from "../../lib/io/constants";
import type {TProfile} from "../../types";
import {getStoredToken, removeStoredToken, setStoredToken} from "./local-storage-actions";

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

// The Go server answers /api/me with {"data":{...}}; a flat profile is read as is.
const toProfile = (body: unknown): TProfile | undefined => {
  const profile = isObject(body) && 'data' in body ? body.data : body

  return isObject(profile) ? (profile as TProfile) : undefined
}


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
    // undefined when there is no profile: a refused token (it is dropped) or
    // no answer. Never an Error object in the store (audit 1.9).
    async getProfile(): Promise<TProfile | undefined> {
      // TODO: need to remove fetch out of the store
      let profile: TProfile | undefined

      try {
        const response = await fetch(`${REST_API_URL}/api/me`, {
          headers: {"X-Auth-Token": this.token || ""}
        })

        if (response.status === 401 || response.status === 403) {
          this.removeToken();
          console.error('Auth Error', response.status, response.statusText)
        } else if (response.ok) {
          profile = toProfile(await response.json())
        }
      } catch (e) {
        console.error(e);
      }

      this.setProfile(profile)

      return profile
    },
    setProfile(profile: TProfile | undefined): void {
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
