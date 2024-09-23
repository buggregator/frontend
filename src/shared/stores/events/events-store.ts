import { defineStore } from 'pinia';
import { PAGE_TYPES } from '../../constants';
import { useSettings } from '../../lib/use-settings';
import {
  type EventId,
  type EventType,
  type ServerEvent,
  type PageEventTypes,
  type TProjects,
  EventTypes,
} from '../../types';
import { useSettingsStore } from '../settings';
import {
  getStoredLockedIds,
  setStoredCachedIds,
  setStoredLockedIds,
  getStoredCachedIds,
  setStoredProject,
  removeStoredProject,
  getStoredProject,
} from './local-storage-actions';
import type { TEventsCachedIdsMap } from './types';

const MAX_EVENTS_COUNT = 500;

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

export const useEventsStore = defineStore('eventsStore', {
  state: () => ({
    events: [] as ServerEvent<unknown>[],
    cachedIds: getStoredCachedIds() || initialCachedIds,
    lockedIds: getStoredLockedIds() || [],
    projects: {
      available: [] as TProjects['data'],
      activeKey: undefined as string | undefined,
    },
  }),
  getters: {
    eventsCounts:
      ({ events }) => (eventType: EventTypes | undefined): number => {
        // TODO: need to use common mapping with changed ids
        const counts = {
          [EventTypes.VarDump]: events.filter(({ type }) => type === EventTypes.VarDump).length,
          [EventTypes.Smtp]: events.filter(({ type }) => type === EventTypes.Smtp).length,
          [EventTypes.Sentry]: events.filter(({ type }) => type === EventTypes.Sentry).length,
          [EventTypes.Profiler]: events.filter(({ type }) => type === EventTypes.Profiler).length,
          [EventTypes.Monolog]: events.filter(({ type }) => type === EventTypes.Monolog).length,
          [EventTypes.Inspector]: events.filter(({ type }) => type === EventTypes.Inspector).length,
          [EventTypes.HttpDump]: events.filter(({ type }) => type === EventTypes.HttpDump).length,
          [EventTypes.RayDump]: events.filter(({ type }) => type === EventTypes.RayDump).length,
        };

        return eventType && counts[eventType] != null
          ? counts[eventType]
          : events.length;
      },
    cachedIdsTypesList({ cachedIds }) {
      return Object.entries(cachedIds)
        .filter((entry) => entry[1].length > 0)
        .map(([key]) => key as PageEventTypes);
    },
    activeProjectKey: ({ projects }) => projects.activeKey,
    activeProject: ({ projects }) => {
      const storedProject = projects.available.find((proj) => proj.key === projects.activeKey);
      const defaultProject = projects.available.find((proj) => proj.is_default);

      return storedProject || defaultProject || projects.available[0];
    },
    availableProjects: ({ projects }) => projects.available,
    isMultipleProjects: ({ projects }) => projects.available.length > 1
      || !projects.available.some((proj) => proj.is_default),
  },
  actions: {
    async initialize(): Promise<void> {
      const {
        api: { getProjects },
      } = useSettings();

      this.initActiveProjectKey();

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
    initializeEvents(events: ServerEvent<unknown>[]): void {
      const { availableEvents } = useSettingsStore();

      this.events = events
        .filter((el) => availableEvents.includes(el.type as EventType))
        .slice(0, MAX_EVENTS_COUNT);

      this.syncCachedWithActive(events.map(({ uuid }) => uuid));
      this.initActiveProjectKey();
    },
    addList(events: ServerEvent<unknown>[]): void {
      const { availableEvents } = useSettingsStore();

      events
        .filter((el) => availableEvents.includes(el.type as EventType))
        .forEach((event) => {
          const isExistedEvent: boolean = this.events.some((el): boolean => el.uuid === event.uuid);

          if (!isExistedEvent) {
            this.events.unshift(event);

            if (this.events.length > MAX_EVENTS_COUNT) {
              this.events.pop();
            }
          } else {
            this.events = this.events.map((el) => {
              if (el.uuid !== event.uuid) {
                // NOTE: add new
                return el;
              }

              // NOTE: replace existed
              return event;
            });
          }
        });
    },
    removeAll() {
      if (this.lockedIds.length) {
        this.events = this.events.filter(({ uuid }) => this.lockedIds.includes(uuid));

        return;
      }

      this.events.length = 0;

      this.removeCachedAll();
    },
    removeByIds(eventUuids: EventId[]) {
      if (this.lockedIds.length) {
        this.events = this.events.filter(
          ({ uuid }) => !eventUuids.includes(uuid) || this.lockedIds.includes(uuid),
        );

        return;
      }

      this.events = this.events.filter(({ uuid }) => !eventUuids.includes(uuid));

      this.removeCachedByIds(eventUuids);
    },
    removeById(eventUuid: EventId) {
      this.removeByIds([eventUuid]);

      this.removeCachedById(eventUuid);
    },
    removeByType(eventType: EventType) {
      if (this.lockedIds.length) {
        this.events = this.events.filter(
          ({ type, uuid }) => type !== eventType || this.lockedIds.includes(uuid),
        );

        return;
      }

      this.events = this.events.filter(({ type }) => type !== eventType);
    },
    // cached ids
    addCachedByType(cachedType: PageEventTypes) {
      this.events
        .filter(({ type }) => type === cachedType || cachedType === PAGE_TYPES.ALL_EVENT_TYPES)
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
          (uuid: EventId) => !uuids.includes(uuid),
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
        this.cachedIds[type] =
          this.cachedIds[type].filter((uuid: EventId) => activeIds.includes(uuid));
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
    },
  },
});
