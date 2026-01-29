import {defineStore} from "pinia";
import {REST_API_URL} from "../../lib/io/constants";
import {type EventType, EventTypes, type TSettings} from "../../types";
import {THEME_MODES} from "./constants";
import {
  getStoredEventsCountVisibility,
  getStoredFixedHeader,
  getStoredActiveTheme,
  setStoredEventsCountVisibility,
  getStoredAutoDeleteEventsTime,
  setStoredAutoDeleteEventsTime,
  setStoredFixedHeader,
  setStoredActiveTheme,
  getStoredPrimaryCodeEditor,
  setStoredPrimaryCodeEditor,
} from "./local-storage-actions";

export const useSettingsStore = defineStore("settingsStore", {
  state: () => ({
    apiVersion: '',
    isFetched: false,
    isAuthEnabled: false,
    authLogicUrl: '/login',
    codeEditor: getStoredPrimaryCodeEditor() || 'phpstorm',
    themeType: getStoredActiveTheme(),
    isFixedHeader: getStoredFixedHeader(),
    isVisibleEventCounts: getStoredEventsCountVisibility(),
    autoDeleteEventsTime: getStoredAutoDeleteEventsTime(),
    availableEvents: [] as EventType[],
  }),
  getters: {
    loginLinkUrl: ({ authLogicUrl }) => `${REST_API_URL}/${authLogicUrl}`,
  },
  actions: {
    async fetchSettings() {
      // TODO: need to remove fetch out of the store
      const settings: TSettings = await fetch(`${REST_API_URL}/api/settings`)
        .then((response) => response.json())
        .catch((e) => {
          console.error(e);

          return null
        });

      if (settings.version) {
        this.apiVersion = settings.version
      }

      if (settings.auth) {
        this.isAuthEnabled = settings.auth.enabled;
        this.authLogicUrl = settings.auth.login_url;
      }

      // TODO: meed to move to the events store
      this.availableEvents = settings?.client?.events ?? Object.values(EventTypes);

      this.isFetched = true

      return settings
    },
    changeTheme() {
      this.themeType = this.themeType === THEME_MODES.DARK
        ? THEME_MODES.LIGHT
        : THEME_MODES.DARK;

      setStoredActiveTheme(this.themeType)
    },
    changeNavbar() {
      this.isFixedHeader = !this.isFixedHeader;

      setStoredFixedHeader(this.isFixedHeader)
    },
    changeEventCountsVisibility() {
      this.isVisibleEventCounts = !this.isVisibleEventCounts;

      setStoredEventsCountVisibility(this.isVisibleEventCounts)
    },
    setAutoDeleteEventsTime(value: string | number | 'none') {
      const normalized =
        value === 'none'
          ? 'none'
          : Number(value);

      this.autoDeleteEventsTime =
        normalized === 'none' || !Number.isFinite(normalized) || normalized <= 0
          ? 'none'
          : normalized;

      setStoredAutoDeleteEventsTime(this.autoDeleteEventsTime);
    },
    changeActiveCodeEditor(editor: string) {
      this.codeEditor = editor;

      setStoredPrimaryCodeEditor(editor);
    }
  },
});
