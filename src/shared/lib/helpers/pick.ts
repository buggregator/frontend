/**
 * Copies the listed own keys of `source` into a new object.
 * Keys the source does not have stay absent (same as lodash.pick).
 */
export const pick = <T extends object, K extends keyof T>(source: T | null | undefined, keys: readonly K[]): Pick<T, K> => {
  const result = {} as Pick<T, K>

  if (source == null) {
    return result
  }

  keys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      result[key] = source[key]
    }
  })

  return result
}
