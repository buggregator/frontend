import { LocalStorageKeys } from '../../types'

export const getStoredToken = (): string => {
  const storedCodeEditor = window?.localStorage?.getItem(LocalStorageKeys.Token)

  return storedCodeEditor || ''
}

export const setStoredToken = (token: string) => {
  localStorage?.setItem(LocalStorageKeys.Token, token)
}

export const removeStoredToken = () => {
  localStorage?.removeItem(LocalStorageKeys.Token)
}
