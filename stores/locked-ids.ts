import { defineStore } from "pinia";
import { LOCAL_STORAGE_KEYS } from '~/src/shared/types';
import type { EventId } from '~/src/shared/types';

const { localStorage } = window;
const getLockedIds = (): EventId[] => {
  const storageValue = localStorage?.getItem(LOCAL_STORAGE_KEYS.LOCKED_EVENTS);

  if (storageValue) {
    return JSON.parse(storageValue) as EventId[];
  }

  return [];
};

const syncLocalStorage = (lockedIds: EventId[]) => {
  localStorage?.setItem(LOCAL_STORAGE_KEYS.LOCKED_EVENTS, JSON.stringify(lockedIds));
}

export const useLockedIdsStore = defineStore("useLockedIdsStore", {
  state: () => ({
    lockedIds: getLockedIds() || [],
  }),
  actions: {
    remove(eventUuid: EventId) {
      this.lockedIds = this.lockedIds.filter((id) => id !== eventUuid);

      syncLocalStorage(this.lockedIds);
    },
    add(eventUuid: EventId) {
      this.lockedIds.push(eventUuid);

      syncLocalStorage(this.lockedIds);
    },
    syncWithActive(activeIds: EventId[]) {
      if (!activeIds.length) {
        this.lockedIds.length = 0;

        return;
      }

      this.lockedIds.filter((lockedId: EventId) => !activeIds.includes(lockedId))

      syncLocalStorage(this.lockedIds);
    }
  }
})
