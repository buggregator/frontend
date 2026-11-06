/** Monolog sends an empty `[]` for empty context/extra and an object otherwise. */
export const hasEntries = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') return false
  return Object.keys(value).length > 0
}
