import { LocalStorageKeys } from '../../types';
import { THEME_MODES } from './constants';

export const getStoredActiveTheme = () => {
  const isStoredTheme = window?.localStorage.getItem(LocalStorageKeys.Theme);
  const isSystemDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (isStoredTheme) {
    if (isStoredTheme === THEME_MODES.DARK) {
      document?.documentElement?.classList?.add(THEME_MODES.DARK);
    } else {
      document?.documentElement?.classList?.remove(THEME_MODES.DARK);
    }

    return isStoredTheme;
  }

  if (isSystemDarkTheme) {
    document?.documentElement?.classList?.add(THEME_MODES.DARK);

    return THEME_MODES.DARK;
  }

  document?.documentElement?.classList?.remove(THEME_MODES.DARK);

  return THEME_MODES.LIGHT;
};

export const setStoredActiveTheme = (themeName: string) => {
  window?.localStorage.setItem(LocalStorageKeys.Theme, themeName);

  if (themeName === THEME_MODES.LIGHT) {
    window?.document?.documentElement?.classList?.remove(THEME_MODES.DARK);
  } else {
    window?.document?.documentElement?.classList?.add(THEME_MODES.DARK);
  }
};

export const getStoredFixedHeader = () => {
  const storedValue: string = window?.localStorage.getItem(LocalStorageKeys.Navbar) || 'true';

  const isFixed: boolean = storedValue === 'true';

  if (isFixed) {
    document?.documentElement?.classList?.add('navbar-fixed');
  } else {
    document?.documentElement?.classList?.remove('navbar-fixed');
  }

  return isFixed;
};

export const setStoredFixedHeader = (state: boolean) => {
  window?.localStorage.setItem(LocalStorageKeys.Navbar, String(state));

  if (state) {
    window?.document?.documentElement?.classList?.add('navbar-fixed');
  } else {
    window?.document?.documentElement?.classList?.remove('navbar-fixed');
  }
};

export const getStoredEventsCountVisibility = (): boolean => {
  const storageValue = window?.localStorage?.getItem(LocalStorageKeys.EventCounts) || 'true';

  return storageValue === 'true';
};

export const setStoredEventsCountVisibility = (state: boolean) => {
  window?.localStorage?.setItem(LocalStorageKeys.EventCounts, String(state));
};

export const getStoredPrimaryCodeEditor = (): string => {
  const storedCodeEditor = window?.localStorage?.getItem(LocalStorageKeys.CodeEditor);

  return storedCodeEditor || '';
};

export const setStoredPrimaryCodeEditor = (editor: string) => {
  window?.localStorage?.setItem(LocalStorageKeys.CodeEditor, editor);
};
