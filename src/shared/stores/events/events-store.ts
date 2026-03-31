import { defineStore } from "pinia";
import { PAGE_TYPES} from "../../constants";
import { logger } from "../../lib/logger";
import {useSettings} from "../../lib/use-settings";
import {
  type EventId,
  type EventType,
  type ServerEvent,
  type PageEventTypes,
  type TProjects,
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

const initialCachedIds: TEventsCachedIdsMap = {
  [PAGE_TYPES.Sentry]: [] as EventId[],
  [PAGE_TYPES.Inspector]: [] as EventId[],
  [PAGE_TYPES.Profiler]: [] as EventId[],
  [PAGE_TYPES.Smtp]: [] as EventId[],
  [PAGE_TYPES.Sms]: [] as EventId[],
  [PAGE_TYPES.RayDump]: [] as EventId[],
  [PAGE_TYPES.VarDump]: [] as EventId[],
  [PAGE_TYPES.HttpDump]: [] as EventId[],
  [PAGE_TYPES.Monolog]: [] as EventId[],
  [PAGE_TYPES.SentryTrace]: [] as EventId[],
  [PAGE_TYPES.SentryLog]: [] as EventId[],
  [PAGE_TYPES.ALL_EVENT_TYPES]: [] as EventId[],
};

export const useEventsStore = defineStore("eventsStore", {
  state: () => ({
    events: [] as ServerEvent<unknown>[],
    searchQuery: '' as string,
    countsMap: new Map<string, number>() as Map<string, number>,
    cachedIds: getStoredCachedIds() || initialCachedIds,
    lockedIds: getStoredLockedIds() || [],
    projects: {
      available: [] as TProjects['data'],
      activeKey: undefined as string | undefined,
    }
  }),
  getters: {
    eventsCounts: ({ countsMap, events }) => (eventType: EventTypes | undefined): number => {
      if (!eventType) {
        return events.length;
      }
      return countsMap.get(eventType) ?? 0;
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
    rebuildCountsMap() {
      this.countsMap.clear();
      for (const event of this.events) {
        this.countsMap.set(event.type as EventType, (this.countsMap.get(event.type as EventType) ?? 0) + 1);
      }
    },
    async initialize (): Promise<void> {
      const {api: { getProjects }} = useSettings();
      this.initActiveProjectKey();

      try {
        const { data } = await getProjects();
        if (data) {
          this.setAvailableProjects(data);
        }
      } catch (e) {
        logger(['Store: Failed to fetch projects', e]);
      }
    },
    // events
    initializeEvents (events: ServerEvent<unknown>[]): void {
      const { availableEvents } = useSettingsStore();

      this.events = events
        .filter((el) => availableEvents.includes(el.type as EventType))
        .slice(0, MAX_EVENTS_COUNT);

      this.rebuildCountsMap();
      this.syncCachedWithActive(events.map(({ uuid }) => uuid));
      this.initActiveProjectKey();
    },
    addList(events: ServerEvent<unknown>[]): void {
      const { availableEvents } = useSettingsStore();
      const existingIds = new Set(this.events.map(e => e.uuid));

      events
        .filter((el) => availableEvents.includes(el.type as EventType))
        .forEach((event) => {
        if (!existingIds.has(event.uuid)) {
          this.events.unshift(event);
          existingIds.add(event.uuid);
          this.countsMap.set(event.type as  EventType, (this.countsMap.get(event.type as EventType) ?? 0) + 1);

          if (this.events.length > MAX_EVENTS_COUNT) {
            const removed = this.events.pop()!;
            const count = this.countsMap.get(removed.type as EventType) ?? 1;
            this.countsMap.set(removed.type as EventType, count - 1);
          }
        } else {
          this.events = this.events.map((el) => el.uuid === event.uuid ? event : el);
        }
      });
    },
    removeAll() {
      if (this.lockedIds.length) {
        this.events = this.events.filter(({ uuid }) => this.lockedIds.includes(uuid));
        this.rebuildCountsMap();

        return
      }

      this.events.length = 0;
      this.countsMap.clear();

      this.removeCachedAll();
    },
    removeByIds(eventUuids: EventId[]) {
      const uuidSet = new Set(eventUuids);

      if (this.lockedIds.length) {
        const lockedSet = new Set(this.lockedIds);
        this.events = this.events.filter(({ uuid }) => !uuidSet.has(uuid) || lockedSet.has(uuid));
        this.rebuildCountsMap();

        return
      }

      this.events = this.events.filter(({ uuid }) => !uuidSet.has(uuid));
      this.rebuildCountsMap();

      this.removeCachedByIds(eventUuids);
    },
    removeById(eventUuid: EventId) {
      this.removeByIds([eventUuid]);

      this.removeCachedById(eventUuid);
    },
    removeByType(eventType: EventType) {
      if (this.lockedIds.length) {
        this.events = this.events.filter(({ type, uuid }) => type !== eventType || this.lockedIds.includes(uuid));
        this.rebuildCountsMap();

        return
      }

      this.events = this.events.filter(({ type }) => type !== eventType);
      this.countsMap.set(eventType, 0);
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
    // locked ids
    removeLockedIds(eventUuid: EventId) {
      this.lockedIds = this.lockedIds.filter((id) => id !== eventUuid);

      setStoredLockedIds(this.lockedIds);
    },
    addLockedIds(eventUuid: EventId) {
      this.lockedIds.push(eventUuid);

      setStoredLockedIds(this.lockedIds);
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
