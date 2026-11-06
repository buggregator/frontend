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
  EventTypes,
  isEventType
} from '../../types';
import {useSettingsStore} from "../settings";
import {
  getStoredLockedIds,
  setStoredCachedIds,
  setStoredLockedIds,
  getStoredCachedIds,
  setStoredProject, removeStoredProject, getStoredProject,
  getStoredPeriod, setStoredPeriod
} from "./local-storage-actions";
import type {TEventsCachedIdsMap} from "./types";

const MAX_EVENTS_COUNT = 500;

// A list request in flight, and what changed here since it started: its reply
// is older than these changes and must not undo them.
type TListLoad = {
  seq: number
  project: string | undefined
  period: string
  added: EventId[]
  removed: EventId[]
  pins: Record<EventId, boolean>
}

// Selectable periods. The value is passed to the API as-is: "24h", "7d", "all".
export const PERIOD_OPTIONS = [
  { value: '1h', label: 'Last hour' },
  { value: '3h', label: 'Last 3 hours' },
  { value: '6h', label: 'Last 6 hours' },
  { value: '12h', label: 'Last 12 hours' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
] as const;

// All time by default: a debugger must not hide older events after a reload
// unless the person narrows the period themselves.
export const DEFAULT_PERIOD = 'all';

// A fresh map every time: pausing pushes into these arrays, so a shared
// object would bring old ids back after every reset.
const createInitialCachedIds = (): TEventsCachedIdsMap => ({
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
});

export const useEventsStore = defineStore("eventsStore", {
  state: () => ({
    events: [] as ServerEvent<unknown>[],
    searchQuery: '' as string,
    countsMap: new Map<string, number>(),
    cachedIds: getStoredCachedIds() || createInitialCachedIds(),
    lockedIds: getStoredLockedIds() || [],
    projects: {
      available: [] as TProjects['data'],
      activeKey: undefined as string | undefined,
    },
    // Selected period. Sent to the API as ?window=<period> to bound lists by
    // time: without it the server returns everything stored for the project,
    // which on a busy instance is tens of megabytes per request.
    period: getStoredPeriod() || DEFAULT_PERIOD,
    listLoadSeq: 0,
    listLoad: null as TListLoad | null,
    // The feed's load from the server: the page shows loading and error
    // states from it instead of the "waiting for events" welcome.
    listState: 'idle' as 'idle' | 'loading' | 'ready' | 'error',
    listError: '' as string,
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
        this.countsMap.set(event.type, (this.countsMap.get(event.type) ?? 0) + 1);
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
        .filter((el) => isEventType(el.type) && availableEvents.includes(el.type))
        .slice(0, MAX_EVENTS_COUNT);

      this.rebuildCountsMap();
      this.syncCachedWithActive(events.map(({ uuid }) => uuid));
      this.initActiveProjectKey();
    },
    addList(events: ServerEvent<unknown>[]): void {
      const { availableEvents } = useSettingsStore();
      const existingIds = new Set(this.events.map(e => e.uuid));

      events
        .filter((el) => isEventType(el.type) && availableEvents.includes(el.type))
        .forEach((event) => {
        if (!existingIds.has(event.uuid)) {
          this.events.unshift(event);
          existingIds.add(event.uuid);
          this.listLoad?.added.push(event.uuid);
          this.countsMap.set(event.type, (this.countsMap.get(event.type) ?? 0) + 1);

          if (this.events.length > MAX_EVENTS_COUNT) {
            const removed = this.events.pop()!;
            const count = this.countsMap.get(removed.type) ?? 1;
            this.countsMap.set(removed.type, count - 1);
          }
        } else {
          this.events = this.events.map((el) => el.uuid === event.uuid ? event : el);
        }
      });
    },
    // Clear keeps pinned events (the server keeps them too) and always ends
    // the pause: the paused snapshot no longer exists.
    removeAll() {
      const lockedSet = new Set(this.lockedIds);
      this.listLoad?.removed.push(...this.events.filter(({ uuid }) => !lockedSet.has(uuid)).map(({ uuid }) => uuid));
      this.events = this.events.filter(({ uuid }) => lockedSet.has(uuid));
      this.rebuildCountsMap();

      this.removeCachedAll();
    },
    removeByIds(eventUuids: EventId[]) {
      const lockedSet = new Set(this.lockedIds);
      const removed = new Set(eventUuids.filter((uuid) => !lockedSet.has(uuid)));
      this.listLoad?.removed.push(...removed);

      this.events = this.events.filter(({ uuid }) => !removed.has(uuid));
      this.rebuildCountsMap();

      this.removeCachedByIds([...removed]);
    },
    removeById(eventUuid: EventId) {
      this.removeByIds([eventUuid]);
    },
    removeByType(eventType: EventType) {
      const lockedSet = new Set(this.lockedIds);
      const removed = this.events
        .filter(({ type, uuid }) => type === eventType && !lockedSet.has(uuid))
        .map(({ uuid }) => uuid);

      this.removeByIds(removed);
    },
    // The server deleted these events (in this tab or another one): they go
    // whether pinned or not.
    dropByIds(eventUuids: EventId[]) {
      const dropped = new Set(eventUuids);

      if (this.lockedIds.some((uuid) => dropped.has(uuid))) {
        dropped.forEach((uuid) => this.recordPin(uuid, false));
        this.lockedIds = this.lockedIds.filter((uuid) => !dropped.has(uuid));
        setStoredLockedIds(this.lockedIds);
      }

      this.removeByIds(eventUuids);
    },
    // The server's list is the truth: after a load, a reconnect or a clear
    // made elsewhere. Pins come from the server too.
    syncFromServer(
      events: ServerEvent<unknown>[],
      lockedIds: EventId[] = events.filter((e) => e.is_pinned).map((e) => e.uuid),
    ) {
      this.lockedIds = lockedIds;
      setStoredLockedIds(this.lockedIds);

      if (!events.length) {
        this.events = [];
        this.countsMap.clear();
        this.removeCachedAll();

        return;
      }

      this.initializeEvents(events);
    },
    // list loads: only the newest reply lands, for the project and period it
    // was asked for, and on top of what changed here meanwhile.
    startListLoad(): number {
      this.listLoadSeq += 1;
      this.listLoad = {
        seq: this.listLoadSeq,
        project: this.projects.activeKey,
        period: this.period,
        added: [],
        removed: [],
        pins: {},
      };

      return this.listLoadSeq;
    },
    // false: an older or outdated reply, nothing changed.
    applyListLoad(seq: number, events: ServerEvent<unknown>[]): boolean {
      const load = this.listLoad;

      if (!load || load.seq !== seq) {
        return false;
      }
      this.listLoad = null;

      if (load.project !== this.projects.activeKey || load.period !== this.period) {
        return false;
      }

      const removed = new Set(load.removed);
      const base = events.filter(({ uuid }) => !removed.has(uuid));
      const baseIds = new Set(base.map(({ uuid }) => uuid));
      const added = new Set(load.added);
      const live = this.events.filter(({ uuid }) => added.has(uuid) && !baseIds.has(uuid));
      const merged = [...live, ...base];

      const locked = new Set(merged.filter((e) => e.is_pinned).map(({ uuid }) => uuid));
      Object.entries(load.pins).forEach(([uuid, pinned]) => (pinned ? locked.add(uuid) : locked.delete(uuid)));

      this.syncFromServer(merged, [...locked]);

      return true;
    },
    // true when the failed request was the newest one (its error counts).
    failListLoad(seq: number): boolean {
      if (this.listLoad?.seq !== seq) {
        return false;
      }
      this.listLoad = null;

      return true;
    },
    recordPin(uuid: EventId, pinned: boolean) {
      if (this.listLoad) {
        this.listLoad.pins[uuid] = pinned;
      }
    },
    // cached ids
    addCachedByType(cachedType: PageEventTypes) {
      this.events
        .filter(({ type }) =>
          type === cachedType || cachedType === PAGE_TYPES.ALL_EVENT_TYPES
        )
        .forEach((event) => {
          if (!this.cachedIds[cachedType].includes(event.uuid)) {
            this.cachedIds[cachedType].push(event.uuid);
          }
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
      this.cachedIds = createInitialCachedIds();
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
      this.recordPin(eventUuid, false);
      this.lockedIds = this.lockedIds.filter((id) => id !== eventUuid);

      setStoredLockedIds(this.lockedIds);
    },
    addLockedIds(eventUuid: EventId) {
      this.recordPin(eventUuid, true);
      if (!this.lockedIds.includes(eventUuid)) {
        this.lockedIds.push(eventUuid);
      }

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
    setListState(state: 'idle' | 'loading' | 'ready' | 'error', error = '') {
      this.listState = state;
      this.listError = error;
    },
    setPeriod(period: string) {
      this.period = period;

      setStoredPeriod(period);
    }
  },
});
