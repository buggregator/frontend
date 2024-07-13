import {LOCAL_STORAGE_KEYS} from "../../types";

export const getStoredToken = (): string => {
  const storedCodeEditor = window?.localStorage?.getItem(LOCAL_STORAGE_KEYS.TOKEN);

  return storedCodeEditor || '';
};

export const setStoredToken = (token: string) => {
  localStorage?.setItem(LOCAL_STORAGE_KEYS.TOKEN, token);
}

export const removeStoredToken = () => {
  localStorage?.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
}
