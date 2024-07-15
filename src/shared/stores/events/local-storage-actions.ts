import {type EventId, SESSION_STORAGE_KEYS} from "../../types";
import type {TEventsCachedIdsMap} from "./types";

const { sessionStorage } = window;

export const getStoredCachedIds = (): TEventsCachedIdsMap | null => {
  const storageValue = sessionStorage?.getItem(SESSION_STORAGE_KEYS.CACHED_EVENTS);

  if (storageValue) {
    return JSON.parse(storageValue) as TEventsCachedIdsMap;
  }

  return null;
};

export const setStoredCachedIds = (cachedEventMap: TEventsCachedIdsMap) => {
  sessionStorage?.setItem(SESSION_STORAGE_KEYS.CACHED_EVENTS, JSON.stringify(cachedEventMap));
}


export const getStoredLockedIds = (): EventId[] | null => {
  const storageValue = sessionStorage?.getItem(SESSION_STORAGE_KEYS.LOCKED_EVENTS);

  if (storageValue) {
    return JSON.parse(storageValue) as EventId[];
  }

  return null;
};

export const setStoredLockedIds = (lockedIds: EventId[]) => {
  sessionStorage?.setItem(SESSION_STORAGE_KEYS.LOCKED_EVENTS, JSON.stringify(lockedIds));
}

export const getStoredProject = (): string | null => sessionStorage?.getItem(SESSION_STORAGE_KEYS.PROJECT) || null;


export const removeStoredProject = () => {
  sessionStorage?.removeItem(SESSION_STORAGE_KEYS.PROJECT);
}

export const setStoredProject = (project: string | null) => {
  if (project) {
    sessionStorage?.setItem(SESSION_STORAGE_KEYS.PROJECT, project);
  } else {
    removeStoredProject()
  }
}
