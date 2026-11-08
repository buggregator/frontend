// A file path short enough for a row: the last two parts, «…/» in front when cut.
export const shortPath = (file: string): string => {
  const parts = file.split('/').filter(Boolean)
  if (parts.length <= 2) return file
  return `…/${parts.slice(-2).join('/')}`
}
