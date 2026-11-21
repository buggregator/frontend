// «188 B», «14.2 KB»: the size Pusher's 10 KB limit is counted in.
export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

const pad = (n: number, size = 2) => String(n).padStart(size, '0')

// «14:02:11.482» in the browser's time zone: events of one request come
// within milliseconds of each other. The server gives seconds as a float.
export const formatClock = (timestamp: number): string => {
  if (!timestamp) return ''
  const d = new Date(timestamp * 1000)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
}
