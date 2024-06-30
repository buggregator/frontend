import {LOCAL_STORAGE_KEYS} from "../../types";
import {THEME_MODES} from "./constants";

export const checkIfThemeActive = () => {
  if (!process.client) {
    return THEME_MODES.LIGHT;
  }

  const isStoredDarkTheme = window?.localStorage.getItem(LOCAL_STORAGE_KEYS.THEME) === THEME_MODES.DARK;
  const isSystemDarkTheme = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (isStoredDarkTheme || isSystemDarkTheme) {
    document?.documentElement?.classList?.add(THEME_MODES.DARK);

    return THEME_MODES.DARK
  }

  document?.documentElement?.classList?.remove(THEME_MODES.DARK);

  return THEME_MODES.LIGHT
};

export const syncThemeLocalStorage = (themeName: string) => {
  window?.localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, themeName);

  if (themeName === THEME_MODES.LIGHT) {
    window?.document?.documentElement?.classList?.remove(THEME_MODES.DARK);
  } else {
    window?.document?.documentElement?.classList?.add(THEME_MODES.DARK);
  }
}

export const getFixedHeaderState = () => {
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

export const syncFixedHeaderLocalStorage = (state: boolean) => {
  window?.localStorage.setItem(LOCAL_STORAGE_KEYS.NAVBAR, String(state));

  if (state) {
    window?.document?.documentElement?.classList?.add("navbar-fixed");
  } else {
    window?.document?.documentElement?.classList?.remove("navbar-fixed");
  }
}

export const getEventsCountVisibleState = (): boolean => {
  const storageValue = window?.localStorage?.getItem(LOCAL_STORAGE_KEYS.EVENT_COUNTS) || "true";

  return storageValue === "true";
};

export const syncEventsCountVisibleLocalStorage = (state: boolean) => {
  window?.localStorage?.setItem(LOCAL_STORAGE_KEYS.EVENT_COUNTS, String(state));
}
