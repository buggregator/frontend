import { defineStore } from "pinia";
import { PAGE_TYPES} from "../../constants";
import { ensureAutoDeleteWatcher } from "../../lib/use-events/auto-delete-events";
import {useSettings} from "../../lib/use-settings";
import {
  type EventId,
  type EventType,
  type ServerEvent,
  type PageEventTypes,
  type TProjects,
  type EventsPreviewMeta,
  EventTypes
} from '../../types';
import {useSettingsStore} from "../settings";
import {
  getStoredLockedIds,
  setStoredCachedIds,
  setStoredLockedIds,
  getStoredCachedIds,
  setStoredProject, removeStoredProject, getStoredProject
} from "./local-storage-actions";
import type {TEventsCachedIdsMap} from "./types";

const MAX_EVENTS_COUNT = 500;
type TPreviewPaginationMap = Record<EventTypes, { cursor: string | null; hasMore: boolean }>;

const initialCachedIds: TEventsCachedIdsMap = {
  [PAGE_TYPES.Sentry]: [] as EventId[],
  [PAGE_TYPES.Inspector]: [] as EventId[],
  [PAGE_TYPES.Profiler]: [] as EventId[],
  [PAGE_TYPES.Smtp]: [] as EventId[],
  [PAGE_TYPES.RayDump]: [] as EventId[],
  [PAGE_TYPES.VarDump]: [] as EventId[],
  [PAGE_TYPES.HttpDump]: [] as EventId[],
  [PAGE_TYPES.Monolog]: [] as EventId[],
  [PAGE_TYPES.ALL_EVENT_TYPES]: [] as EventId[],
};

const initialEventCounts: Record<EventTypes, number> = {
  [EventTypes.VarDump]: 0,
  [EventTypes.Smtp]: 0,
  [EventTypes.Sentry]: 0,
  [EventTypes.Profiler]: 0,
  [EventTypes.Monolog]: 0,
  [EventTypes.Inspector]: 0,
  [EventTypes.HttpDump]: 0,
  [EventTypes.RayDump]: 0,
}

const createInitialPreviewPagination = (): TPreviewPaginationMap => ({
  [EventTypes.VarDump]: { cursor: null, hasMore: false },
  [EventTypes.Smtp]: { cursor: null, hasMore: false },
  [EventTypes.Sentry]: { cursor: null, hasMore: false },
  [EventTypes.Profiler]: { cursor: null, hasMore: false },
  [EventTypes.Monolog]: { cursor: null, hasMore: false },
  [EventTypes.Inspector]: { cursor: null, hasMore: false },
  [EventTypes.HttpDump]: { cursor: null, hasMore: false },
  [EventTypes.RayDump]: { cursor: null, hasMore: false },
});

export const useEventsStore = defineStore("eventsStore", {
  state: () => ({
    events: [] as ServerEvent<unknown>[],
    cachedIds: getStoredCachedIds() || initialCachedIds,
    lockedIds: getStoredLockedIds() || [],
    eventCounts: { ...initialEventCounts },
    previewPagination: createInitialPreviewPagination(),
    projects: {
      available: [] as TProjects['data'],
      activeKey: undefined as string | undefined,
    }
  }),
  getters: {
    eventsCounts: ({ eventCounts }) => (eventType: EventTypes | undefined): number => {
      if (eventType) {
        return eventCounts[eventType] ?? 0;
      }

      return Object.values(eventCounts).reduce((total, count) => total + count, 0);
    },
    cachedIdsTypesList({ cachedIds }) {
      return Object.entries(cachedIds).filter(([_, value]) => value.length > 0).map(([key]) => key as PageEventTypes)
    },
    activeProjectKey: ({ projects }) => projects.activeKey,
    activeProject: ({ projects }) => {
      const storedProject = projects.available.find((proj) => proj.key === projects.activeKey)
      const defaultProject = projects.available.find((proj) => proj.is_default)

      return storedProject || defaultProject || projects.available[0]
    },
    availableProjects: ({ projects }) => projects.available,
    isMultipleProjects: ({ projects }) => (
      projects.available.length > 1 ||
      !projects.available.some((proj) => proj.is_default)
    ),
  },
  actions: {
    async initialize (): Promise<void> {
      const {api: { getProjects }} = useSettings();
      this.initActiveProjectKey();
      ensureAutoDeleteWatcher();

      try {
        const { data } = await getProjects();
        if (data) {
          this.setAvailableProjects(data);
        }
      } catch (e) {
        console.error(e);
      }
    },
    // events
    initializeEvents (events: ServerEvent<unknown>[]): void {
      const { availableEvents } = useSettingsStore();

      this.events = events
        .filter((el) => availableEvents.includes(el.type as EventType))
        .slice(0, MAX_EVENTS_COUNT);

      this.syncCachedWithActive(events.map(({ uuid }) => uuid));
      this.initActiveProjectKey();
    },
    addList(events: ServerEvent<unknown>[], options?: { updateCounts?: boolean }): void {
      const { availableEvents } = useSettingsStore();
      const shouldUpdateCounts = options?.updateCounts !== false;

      events
        .filter((el) => availableEvents.includes(el.type as EventType))
        .forEach((event) => {
        const isExistedEvent: boolean = this.events.some((el): boolean => el.uuid === event.uuid);
        if (!isExistedEvent) {
          this.events.unshift(event)

          if (shouldUpdateCounts) {
            this.incrementEventCount(event.type as EventTypes)
          }

          if (this.events.length > MAX_EVENTS_COUNT) {
            this.events.pop()
          }
        } else {
          this.events = this.events.map((el) => {
            if (el.uuid !== event.uuid) {
              return el; // add new
            }

            return event; // replace existed
          });
        }
      });
    },
    mergeEvents(events: ServerEvent<unknown>[], options?: { updateCounts?: boolean }): void {
      const { availableEvents } = useSettingsStore();
      const shouldUpdateCounts = options?.updateCounts !== false;
      const filteredEvents = events.filter((el) => availableEvents.includes(el.type as EventType));

      if (!filteredEvents.length) {
        return;
      }

      const eventsById = new Map(this.events.map((event) => [event.uuid, event]));

      filteredEvents.forEach((event) => {
        const isExistedEvent = eventsById.has(event.uuid);
        eventsById.set(event.uuid, event);

        if (shouldUpdateCounts && !isExistedEvent) {
          this.incrementEventCount(event.type as EventTypes)
        }
      });

      const mergedEvents = Array.from(eventsById.values())
        .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));

      this.events = mergedEvents.slice(0, MAX_EVENTS_COUNT);
    },
    removeAll() {
      if (this.lockedIds.length) {
        this.events = this.events.filter(({ uuid }) => this.lockedIds.includes(uuid));

        this.resetEventCounts();
        return;
      }

      this.events.length = 0;

      this.removeCachedAll();
      this.resetEventCounts();
    },
    removeByIds(eventUuids: EventId[]) {
      const removedEvents = this.events.filter(({ uuid }) =>
        eventUuids.includes(uuid) && !this.lockedIds.includes(uuid)
      );

      if (this.lockedIds.length) {
        this.events = this.events.filter(({ uuid }) => !eventUuids.includes(uuid) || this.lockedIds.includes(uuid));

        removedEvents.forEach((event) => this.decrementEventCount(event.type as EventTypes));
        return;
      }

      this.events = this.events.filter(({ uuid }) => !eventUuids.includes(uuid));

      this.removeCachedByIds(eventUuids);
      removedEvents.forEach((event) => this.decrementEventCount(event.type as EventTypes));
    },
    removeById(eventUuid: EventId) {
      this.removeByIds([eventUuid]);

      this.removeCachedById(eventUuid);
    },
    removeByType(eventType: EventType) {
      if (this.lockedIds.length) {
        this.events = this.events.filter(({ type, uuid }) => type !== eventType || this.lockedIds.includes(uuid));

        this.resetEventCountByType(eventType as EventTypes);
        return;
      }

      this.events = this.events.filter(({ type }) => type !== eventType);
      this.resetEventCountByType(eventType as EventTypes);
    },
    // cached ids
    addCachedByType(cachedType: PageEventTypes) {
      this.events
        .filter(({ type }) =>
          type === cachedType || cachedType === PAGE_TYPES.ALL_EVENT_TYPES
        )
        .forEach((event) => {
          this.cachedIds[cachedType].push(event.uuid);
        });

      setStoredCachedIds(this.cachedIds);
    },
    appendCachedIds(cachedType: PageEventTypes, uuids: EventId[]) {
      if (!uuids.length) {
        return;
      }

      const cached = new Set(this.cachedIds[cachedType]);
      uuids.forEach((uuid) => cached.add(uuid));

      this.cachedIds[cachedType] = Array.from(cached);
      setStoredCachedIds(this.cachedIds);
    },
    removeCachedByType(type: PageEventTypes) {
      this.cachedIds[type].length = 0;
      setStoredCachedIds(this.cachedIds);
    },
    removeCachedByIds(uuids: EventId[]) {
      this.cachedIdsTypesList.forEach((type) => {
        this.cachedIds[type] = this.cachedIds[type].filter(
          (uuid: EventId) => !uuids.includes(uuid)
        );
      });

      setStoredCachedIds(this.cachedIds);
    },
    removeCachedById(eventUuid: EventId) {
      this.removeCachedByIds([eventUuid]);
    },
    removeCachedAll() {
      this.cachedIds = initialCachedIds;
      setStoredCachedIds(this.cachedIds);
    },
    syncCachedWithActive(activeIds: EventId[]) {
      if (!activeIds.length) {
        this.removeCachedAll();

        return;
      }

      this.cachedIdsTypesList.forEach((type) => {
        this.cachedIds[type] = this.cachedIds[type].filter(
          (uuid: EventId) => activeIds.includes(uuid)
        );
      });

      setStoredCachedIds(this.cachedIds);
    },
    setPreviewPagination(type: EventTypes, meta: EventsPreviewMeta | null) {
      if (!meta) {
        this.previewPagination[type] = { cursor: null, hasMore: false };
        return;
      }

      this.previewPagination[type] = {
        cursor: meta.next_cursor ?? null,
        hasMore: meta.has_more,
      };
    },
    resetPreviewPagination() {
      this.previewPagination = createInitialPreviewPagination();
    },
    // locked ids
    removeLockedIds(eventUuid: EventId) {
      this.lockedIds = this.lockedIds.filter((id) => id !== eventUuid);

      setStoredLockedIds(this.lockedIds);
    },
    addLockedIds(eventUuid: EventId) {
      this.lockedIds.push(eventUuid);

      setStoredLockedIds(this.lockedIds);
    },
    setEventCounts(typeCounts: { type: string; count: number }[]) {
      const nextCounts = { ...initialEventCounts };

      typeCounts.forEach(({ type, count }) => {
        if (type in nextCounts) {
          nextCounts[type as EventTypes] = count;
        }
      });

      this.eventCounts = nextCounts;
    },
    incrementEventCount(type: EventTypes, amount = 1) {
      if (type in this.eventCounts) {
        this.eventCounts[type] = Math.max(0, this.eventCounts[type] + amount);
      }
    },
    decrementEventCount(type: EventTypes, amount = 1) {
      if (type in this.eventCounts) {
        this.eventCounts[type] = Math.max(0, this.eventCounts[type] - amount);
      }
    },
    resetEventCounts() {
      this.eventCounts = { ...initialEventCounts };
    },
    resetEventCountByType(type: EventTypes) {
      if (type in this.eventCounts) {
        this.eventCounts[type] = 0;
      }
    },
    // projects
    initActiveProjectKey() {
      this.projects.activeKey = getStoredProject() || this.activeProjectKey;
    },
    setAvailableProjects(projects: TProjects['data']) {
      if (projects.length > 0) {
        this.projects.available = projects;

        if (!this.projects.activeKey) {
          const defaultProject = projects.find((proj) => proj.is_default) || projects[0];
          this.setActiveProjectKey(defaultProject.key);
        }
      } else {
        this.resetActiveProjectKey();
      }
    },
    setActiveProjectKey(project: string) {
      this.projects.activeKey = project;

      setStoredProject(project);
    },
    resetActiveProjectKey() {
      this.projects.activeKey = undefined;

      removeStoredProject();
    }
  },
});
