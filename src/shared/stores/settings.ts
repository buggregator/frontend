import { defineStore } from "pinia";
import { LOCAL_STORAGE_KEYS } from "../types";

export const THEME_MODES = {
  LIGHT: "light",
  DARK: "dark",
};

const checkThemeActive = () => {
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

const checkHeaderFixed = () => {
  if (process.client) {
    const storedValue: string = window?.localStorage.getItem(LOCAL_STORAGE_KEYS.NAVBAR) || "true";


    const isFixed: boolean = storedValue === "true"

    if (isFixed) {
      document?.documentElement?.classList?.add("navbar-fixed");
    } else {
      document?.documentElement?.classList?.remove("navbar-fixed");
    }

    return isFixed;
  }

  return {
    themeType: false,
  };
}

export const useSettingsStore = defineStore("settingsStore", {
  state: () => ({
    themeType: checkThemeActive(),
    isFixedHeader: checkHeaderFixed(),
  }),
  actions: {
    changeTheme() {
      this.themeType = this.themeType === THEME_MODES.DARK
        ? THEME_MODES.LIGHT
        : THEME_MODES.DARK;

      window?.localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, this.themeType);

      if (this.themeType === THEME_MODES.LIGHT) {
        document?.documentElement?.classList?.remove(THEME_MODES.DARK);
      } else {
        document?.documentElement?.classList?.add(THEME_MODES.DARK);
      }
    },
    changeNavbar() {
      this.isFixedHeader = !this.isFixedHeader;

      window?.localStorage.setItem(LOCAL_STORAGE_KEYS.NAVBAR, String(this.isFixedHeader));

      if (this.isFixedHeader) {
        document?.documentElement?.classList?.add("navbar-fixed");
      } else {
        document?.documentElement?.classList?.remove("navbar-fixed");
      }
    }
  },
});
