import { storeToRefs } from "pinia";
import { watch } from "vue";
import { useEventsStore, useSettingsStore } from "../../stores";
import type { EventId } from "../../types";
import { useEventsApi } from "./use-events-api";

type AutoDeleteTime = number | "none";

const autoDeleteTimers = new Map<EventId, ReturnType<typeof setTimeout>>();
let autoDeleteInitialized = false;

const toAutoDeleteMs = (val: AutoDeleteTime): number | null => {
  if (val === "none") return null;
  return val * 60 * 1000;
};

const clearAutoDeleteTimer = (eventId: EventId) => {
  const timer = autoDeleteTimers.get(eventId);
  if (!timer) return;
  globalThis.clearTimeout(timer);
  autoDeleteTimers.delete(eventId);
};

const clearAllAutoDeleteTimers = () => {
  autoDeleteTimers.forEach((timer) => globalThis.clearTimeout(timer));
  autoDeleteTimers.clear();
};

export const ensureAutoDeleteWatcher = () => {
  if (autoDeleteInitialized) return;
  autoDeleteInitialized = true;

  const eventsStore = useEventsStore();
  const settingsStore = useSettingsStore();
  const eventsApi = useEventsApi();

  const { events, lockedIds } = storeToRefs(eventsStore);
  const { autoDeleteEventsTime } = storeToRefs(settingsStore);

  const schedule = (eventId: EventId) => {
    const ms = toAutoDeleteMs(autoDeleteEventsTime.value);
    if (ms === null || autoDeleteTimers.has(eventId)) return;

    const timer = globalThis.setTimeout(() => {
      autoDeleteTimers.delete(eventId);

      const locked = lockedIds.value ?? [];
      if (locked.includes(eventId)) return;

      void eventsApi.removeById(eventId);
    }, ms);

    autoDeleteTimers.set(eventId, timer);
  };

  const rescheduleAll = () => {
    clearAllAutoDeleteTimers();

    const ms = toAutoDeleteMs(autoDeleteEventsTime.value);
    if (ms === null) return;

    events.value.forEach(({ uuid }) => {
      schedule(uuid);
    });
  };

  const syncTimers = (currentIds: Set<EventId>, prevIds: Set<EventId>) => {
    prevIds.forEach((id) => {
      if (!currentIds.has(id)) {
        clearAutoDeleteTimer(id);
      }
    });

    if (toAutoDeleteMs(autoDeleteEventsTime.value) === null) return;

    currentIds.forEach((id) => {
      if (!prevIds.has(id)) {
        schedule(id);
      }
    });
  };

  watch(
    autoDeleteEventsTime,
    () => {
      rescheduleAll();
    },
    { immediate: true },
  );

  watch(
    () => events.value.map(({ uuid }) => uuid),
    (current, prev) => {
      const currentIds = new Set(current);
      const prevIds = new Set(prev ?? []);

      syncTimers(currentIds, prevIds);
    },
  );

  watch(
    () => lockedIds.value.slice(),
    (current, prev) => {
      const currentIds = new Set(current);
      const prevIds = new Set(prev ?? []);

      const eventsIds = new Set(events.value.map(({ uuid }) => uuid));
      const unlockedIds = new Set(
        [...prevIds].filter((id) => !currentIds.has(id) && eventsIds.has(id)),
      );

      syncTimers(currentIds, prevIds);
      syncTimers(unlockedIds, new Set<EventId>());
    },
  );
};
