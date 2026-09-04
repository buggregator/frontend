import {type EventId, LocalStorageKeys, SessionStorageKeys} from "../../types";
import type {TEventsCachedIdsMap} from "./types";

const { sessionStorage } = window;

export const getStoredCachedIds = (): TEventsCachedIdsMap | null => {
  const storageValue = sessionStorage?.getItem(SessionStorageKeys.CachedEvents);

  if (storageValue) {
    return JSON.parse(storageValue) as TEventsCachedIdsMap;
  }

  return null;
};

export const setStoredCachedIds = (cachedEventMap: TEventsCachedIdsMap) => {
  sessionStorage?.setItem(SessionStorageKeys.CachedEvents, JSON.stringify(cachedEventMap));
}


export const getStoredLockedIds = (): EventId[] | null => {
  const storageValue = sessionStorage?.getItem(SessionStorageKeys.LockedEvents);

  if (storageValue) {
    return JSON.parse(storageValue) as EventId[];
  }

  return null;
};

export const setStoredLockedIds = (lockedIds: EventId[]) => {
  sessionStorage?.setItem(SessionStorageKeys.LockedEvents, JSON.stringify(lockedIds));
}

export const getStoredProject = (): string | null => sessionStorage?.getItem(SessionStorageKeys.Project) || null;


export const removeStoredProject = () => {
  sessionStorage?.removeItem(SessionStorageKeys.Project);
}

export const setStoredProject = (project: string | null) => {
  if (project) {
    sessionStorage?.setItem(SessionStorageKeys.Project, project);
  } else {
    removeStoredProject()
  }
}

// The period lives in localStorage rather than sessionStorage (where the
// project is kept): the chosen window is a user habit, not tab state.
export const getStoredPeriod = (): string | null =>
  window?.localStorage?.getItem(LocalStorageKeys.Period) || null;

export const setStoredPeriod = (period: string) => {
  window?.localStorage?.setItem(LocalStorageKeys.Period, period);
}
