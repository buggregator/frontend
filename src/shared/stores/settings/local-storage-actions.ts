import {LOCAL_STORAGE_KEYS} from "../../types";
import {THEME_MODES} from "./constants";

export const getStoredActiveTheme = () => {
  const isStoredTheme = window?.localStorage.getItem(LOCAL_STORAGE_KEYS.THEME);
  const isSystemDarkTheme = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (isStoredTheme) {
    if (isStoredTheme === THEME_MODES.DARK) {
      document?.documentElement?.classList?.add(THEME_MODES.DARK);
    } else {
      document?.documentElement?.classList?.remove(THEME_MODES.DARK);
    }

    return isStoredTheme
  }

  if (isSystemDarkTheme) {
    document?.documentElement?.classList?.add(THEME_MODES.DARK);

    return THEME_MODES.DARK
  }

  document?.documentElement?.classList?.remove(THEME_MODES.DARK);

  return THEME_MODES.LIGHT
};

export const setStoredActiveTheme = (themeName: string) => {
  window?.localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, themeName);

  if (themeName === THEME_MODES.LIGHT) {
    window?.document?.documentElement?.classList?.remove(THEME_MODES.DARK);
  } else {
    window?.document?.documentElement?.classList?.add(THEME_MODES.DARK);
  }
}

export const getStoredFixedHeader = () => {
  if (!process.client) {
    return  false;
  }

  const storedValue: string = window?.localStorage.getItem(LOCAL_STORAGE_KEYS.NAVBAR) || "true";

  const isFixed: boolean = storedValue === "true"

  if (isFixed) {
    document?.documentElement?.classList?.add("navbar-fixed");
  } else {
    document?.documentElement?.classList?.remove("navbar-fixed");
  }

  return isFixed;
}

export const setStoredFixedHeader = (state: boolean) => {
  window?.localStorage.setItem(LOCAL_STORAGE_KEYS.NAVBAR, String(state));

  if (state) {
    window?.document?.documentElement?.classList?.add("navbar-fixed");
  } else {
    window?.document?.documentElement?.classList?.remove("navbar-fixed");
  }
}

export const getStoredEventsCountVisibility = (): boolean => {
  const storageValue = window?.localStorage?.getItem(LOCAL_STORAGE_KEYS.EVENT_COUNTS) || "true";

  return storageValue === "true";
};

export const setStoredEventsCountVisibility = (state: boolean) => {
  window?.localStorage?.setItem(LOCAL_STORAGE_KEYS.EVENT_COUNTS, String(state));
}


export const getStoredPrimaryCodeEditor = (): string => {
  const storedCodeEditor = window?.localStorage?.getItem(LOCAL_STORAGE_KEYS.CODE_EDITOR);

  return storedCodeEditor || '';
};

export const setStoredPrimaryCodeEditor = (editor: string) => {
  window?.localStorage?.setItem(LOCAL_STORAGE_KEYS.CODE_EDITOR, editor);
}
