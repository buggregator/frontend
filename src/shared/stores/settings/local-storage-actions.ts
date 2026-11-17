import {IDE_KEYS, IDE_KEY_DEFAULT} from "../../constants";
import {LocalStorageKeys} from "../../types";
import {THEME_MODES} from "./constants";

export type ThemeMode = 'light' | 'dark' | 'system'

const prefersDark = () => !!window.matchMedia?.("(prefers-color-scheme: dark)").matches;

// No stored choice, or «system», follows the system theme.
export const getStoredThemeMode = (): ThemeMode => {
  const stored = window?.localStorage.getItem(LocalStorageKeys.Theme);

  return stored === THEME_MODES.LIGHT || stored === THEME_MODES.DARK ? stored : THEME_MODES.SYSTEM;
};

export const setStoredThemeMode = (mode: ThemeMode) => {
  window?.localStorage.setItem(LocalStorageKeys.Theme, mode);
};

// The theme the page shows for a mode: light or dark.
export const resolveTheme = (mode: ThemeMode): 'light' | 'dark' => {
  if (mode === THEME_MODES.SYSTEM) {
    return prefersDark() ? THEME_MODES.DARK : THEME_MODES.LIGHT;
  }

  return mode;
};

export const applyTheme = (theme: 'light' | 'dark') => {
  window?.document?.documentElement?.classList?.toggle(THEME_MODES.DARK, theme === THEME_MODES.DARK);
};

export const getStoredActiveTheme = () => {
  const theme = resolveTheme(getStoredThemeMode());
  applyTheme(theme);

  return theme;
};

export const onSystemThemeChange = (callback: () => void) => {
  window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", callback);
};

export const getStoredFixedHeader = () => {
  const storedValue: string = window?.localStorage.getItem(LocalStorageKeys.Navbar) || "true";

  const isFixed: boolean = storedValue === "true"

  if (isFixed) {
    document?.documentElement?.classList?.add("navbar-fixed");
  } else {
    document?.documentElement?.classList?.remove("navbar-fixed");
  }

  return isFixed;
}

export const setStoredFixedHeader = (state: boolean) => {
  window?.localStorage.setItem(LocalStorageKeys.Navbar, String(state));

  if (state) {
    window?.document?.documentElement?.classList?.add("navbar-fixed");
  } else {
    window?.document?.documentElement?.classList?.remove("navbar-fixed");
  }
}

export const getStoredEventsCountVisibility = (): boolean => {
  const storageValue = window?.localStorage?.getItem(LocalStorageKeys.EventCounts) || "true";

  return storageValue === "true";
};

export const setStoredEventsCountVisibility = (state: boolean) => {
  window?.localStorage?.setItem(LocalStorageKeys.EventCounts, String(state));
}


// On unless the person turned them off.
export const getStoredSingleKeyShortcuts = (): boolean =>
  window?.localStorage?.getItem(LocalStorageKeys.SingleKeyShortcuts) !== "false";

export const setStoredSingleKeyShortcuts = (state: boolean) => {
  window?.localStorage?.setItem(LocalStorageKeys.SingleKeyShortcuts, String(state));
}

// Off unless the person turned them on.
export const getStoredKeyHints = (): boolean =>
  window?.localStorage?.getItem(LocalStorageKeys.KeyHints) === "true";

export const setStoredKeyHints = (state: boolean) => {
  window?.localStorage?.setItem(LocalStorageKeys.KeyHints, String(state));
}

export const getStoredPrimaryCodeEditor = (): IDE_KEYS => {
  const storedCodeEditor = window?.localStorage?.getItem(LocalStorageKeys.CodeEditor);

  return storedCodeEditor && Object.values(IDE_KEYS).includes(storedCodeEditor as IDE_KEYS) ? storedCodeEditor as IDE_KEYS : IDE_KEY_DEFAULT;
};

// True once the person picked an editor in Settings (any valid one, the
// default included); false while the editor is only the default.
export const getStoredIsCodeEditorChosen = (): boolean => {
  const storedCodeEditor = window?.localStorage?.getItem(LocalStorageKeys.CodeEditor);

  return !!storedCodeEditor && Object.values(IDE_KEYS).includes(storedCodeEditor as IDE_KEYS);
};

export const setStoredPrimaryCodeEditor = (editor: string) => {
  window?.localStorage?.setItem(LocalStorageKeys.CodeEditor, editor);
}

export const setStoredCustomFilePathMapping = (mapping: { source_path: string, target_path: string }[]) => {
  window?.localStorage?.setItem(LocalStorageKeys.CustomFilePathMapping, JSON.stringify(mapping));
}

export const getStoredCustomFilePathMapping = (): { source_path: string, target_path: string }[] => {
  const storedMapping = window?.localStorage?.getItem(LocalStorageKeys.CustomFilePathMapping);

  if (storedMapping) {
    try {
      return JSON.parse(storedMapping);
    } catch (e) {
      console.error("Failed to parse custom file path mapping from local storage", e);
      return [];
    }
  }

  return [];
}

export const setStoredIsActiveCustomFilePathMapping = (state: boolean) => {
  window?.localStorage?.setItem(LocalStorageKeys.IsActiveCustomFilePathMapping, String(state));
}

export const getStoredIsActiveCustomFilePathMapping = (): boolean => {
  const storageValue = window?.localStorage?.getItem(LocalStorageKeys.IsActiveCustomFilePathMapping) || "false";

  return storageValue === "true";
}
