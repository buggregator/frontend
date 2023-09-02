import { defineStore } from "pinia";
import { LOCAL_STORAGE_KEYS } from "~/config/constants";

export const THEME_MODES = {
  LIGHT: "light",
  DARK: "dark",
};

const checkDarkTheme = () => {
  if (process.client) {
    return (
      window?.localStorage.getItem(LOCAL_STORAGE_KEYS.THEME) ===
        THEME_MODES.DARK ||
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }

  return {
    themeType: false,
  };
};

export const useThemeStore = defineStore("themeStore", {
  state: () => ({
    themeType: checkDarkTheme() ? THEME_MODES.DARK : THEME_MODES.LIGHT,
  }),
  actions: {
    themeChange() {
      const newType =
        this.themeType === THEME_MODES.DARK
          ? THEME_MODES.LIGHT
          : THEME_MODES.DARK;

      window?.localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, newType);
      this.themeType = newType;
    },
  },
});
