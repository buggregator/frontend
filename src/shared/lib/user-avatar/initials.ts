// Initials for a user without a picture (#6770): Keycloak, Dex and Authentik
// send no avatar. «Ann Smith» → «AS», «john.doe@host» → «JD», «admin» → «A».
// Takes the first value that has a letter or digit; none → «?».
const firstChar = (word: string) => Array.from(word)[0] ?? ''

const initialsOf = (value: string) => {
  const local = value.includes('@') ? value.slice(0, value.indexOf('@')) : value
  const words = local.split(/[\s._-]+/).filter((w) => /[\p{L}\p{N}]/u.test(w))
  return words
    .slice(0, 2)
    .map((w) => firstChar(w.replace(/^[^\p{L}\p{N}]+/u, '')).toUpperCase())
    .join('')
}

export const userInitials = (...values: Array<string | null | undefined>): string => {
  for (const value of values) {
    const initials = value ? initialsOf(value.trim()) : ''
    if (initials) return initials
  }
  return '?'
}
