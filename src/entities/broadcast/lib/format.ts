const pad = (n: number, size = 2) => String(n).padStart(size, '0')

// «14:02:11.482» in the browser's time zone: events of one request come
// within milliseconds of each other. The server gives seconds as a float.
export const formatClock = (timestamp: number): string => {
  if (!timestamp) return ''
  const d = new Date(timestamp * 1000)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
}
