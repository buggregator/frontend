import {defineStore} from "pinia";
import {IDE_KEY_DEFAULT, IDE_KEYS} from "../../constants";
import {REST_API_URL} from "../../lib/io/constants";
import {describeLoadError} from "../../lib/io/request-result";
import {EventTypes, type FilePathMapping, type TSettings} from "../../types";
import {THEME_MODES} from "./constants";
import {
  getStoredEventsCountVisibility,
  getStoredFixedHeader,
  getStoredActiveTheme,
  setStoredEventsCountVisibility,
  setStoredFixedHeader,
  setStoredActiveTheme,
  getStoredPrimaryCodeEditor,
  getStoredIsCodeEditorChosen,
  setStoredPrimaryCodeEditor, setStoredCustomFilePathMapping, getStoredCustomFilePathMapping,
  setStoredIsActiveCustomFilePathMapping, getStoredIsActiveCustomFilePathMapping,
  getStoredSingleKeyShortcuts, setStoredSingleKeyShortcuts,
  getStoredKeyHints, setStoredKeyHints,
} from "./local-storage-actions";
import {toUpdateInfo, type UpdateInfo} from "./update-info";

export const useSettingsStore = defineStore("settingsStore", {
  state: () => ({
    apiVersion: '',
    // A newer server release, from the server's own check; null = show nothing.
    update: null as UpdateInfo | null,
    isFetched: false,
    // Why the settings could not be loaded; the app shows it instead of a
    // blank page (audit 1.9).
    fetchError: '',
    isAuthEnabled: false,
    authLogicUrl: '/login',
    codeEditor: getStoredPrimaryCodeEditor() || IDE_KEY_DEFAULT,
    // Picked in Settings, not just the default: then it wins over an IDE link
    // the SDK sent (VarDumper file_link).
    isCodeEditorChosen: getStoredIsCodeEditorChosen(),
    themeType: getStoredActiveTheme(),
    isFixedHeader: getStoredFixedHeader(),
    isVisibleEventCounts: getStoredEventsCountVisibility(),
    isSingleKeyShortcutsEnabled: getStoredSingleKeyShortcuts(),
    // Small key badges: a hint bar on event pages, hints under inputs.
    isKeyHintsEnabled: getStoredKeyHints(),
    // The types the server says it has. A newer server can list one this UI
    // does not know: its events still show, with the default card.
    availableEvents: [] as string[],
    isActiveFilePathMapping: getStoredIsActiveCustomFilePathMapping() || false,
    customFilePathMapping: getStoredCustomFilePathMapping() || [],
  }),
  getters: {
    loginLinkUrl: ({ authLogicUrl }) => `${REST_API_URL}/${authLogicUrl}`,
  },
  actions: {
    async fetchSettings(): Promise<TSettings | null> {
      // TODO: need to remove fetch out of the store
      let settings: TSettings | null = null
      this.fetchError = ''

      try {
        const response = await fetch(`${REST_API_URL}/api/settings`)

        if (!response.ok) {
          throw Object.assign(new Error(response.statusText), { status: response.status })
        }

        settings = await response.json()
      } catch (e) {
        console.error(e);
        this.fetchError = describeLoadError(e)
      }

      if (settings?.version) {
        this.apiVersion = settings.version
      }

      if (settings?.auth) {
        this.isAuthEnabled = settings.auth.enabled;
        this.authLogicUrl = settings.auth.login_url;
      }

      this.update = toUpdateInfo(settings?.update)

      // TODO: meed to move to the events store
      this.availableEvents = settings?.client?.events ?? Object.values(EventTypes);

      this.isFetched = !!settings

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
    changeSingleKeyShortcuts() {
      this.isSingleKeyShortcutsEnabled = !this.isSingleKeyShortcutsEnabled;

      setStoredSingleKeyShortcuts(this.isSingleKeyShortcutsEnabled)
    },
    changeKeyHints() {
      this.isKeyHintsEnabled = !this.isKeyHintsEnabled;

      setStoredKeyHints(this.isKeyHintsEnabled)
    },
    changeEventCountsVisibility() {
      this.isVisibleEventCounts = !this.isVisibleEventCounts;

      setStoredEventsCountVisibility(this.isVisibleEventCounts)
    },
    changeActiveCodeEditor(editor: IDE_KEYS) {
      this.codeEditor = editor;
      this.isCodeEditorChosen = true;

      setStoredPrimaryCodeEditor(editor);
    },
    setCustomFilePathMapping(mapping: FilePathMapping[]) {
      this.customFilePathMapping = mapping;

      setStoredCustomFilePathMapping(mapping)
    },
    changeIsActiveFilePathMapping(state: boolean) {
      this.isActiveFilePathMapping = state;

      setStoredIsActiveCustomFilePathMapping(state);
    }
  },
});
