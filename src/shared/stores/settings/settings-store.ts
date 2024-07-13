import {defineStore} from "pinia";
import {useSettings} from "../../lib/use-settings";
import type { TSettings } from "../../types";
import {THEME_MODES} from "./constants";
import {
  getStoredEventsCountVisibility,
  getStoredFixedHeader,
  getStoredActiveTheme,
  setStoredEventsCountVisibility,
  setStoredFixedHeader,
  setStoredActiveTheme, getStoredPrimaryCodeEditor, setStoredPrimaryCodeEditor,
} from "./local-storage-actions";

export const useSettingsStore = defineStore("settingsStore", {
  state: () => ({
    apiVersion: '',
    auth: {
      isEnabled: false,
      loginUrl: '/login',
    },
    codeEditor: getStoredPrimaryCodeEditor() || 'phpstorm',
    themeType: getStoredActiveTheme(),
    isFixedHeader: getStoredFixedHeader(),
    isVisibleEventCounts: getStoredEventsCountVisibility(),
  }),
  actions: {
    initialize() {
      const {api: { getSettings }} = useSettings();

      getSettings().then(({ version, auth } = {} as TSettings) => {
        if (version) {
          this.apiVersion = version
        }

        if (auth) {
          this.auth.isEnabled = auth.enabled;
          this.auth.loginUrl = auth.login_url;
        }
      })
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
    changeActiveCodeEditor(editor: string) {
      this.codeEditor = editor;

      setStoredPrimaryCodeEditor(editor);
    }
  },
});