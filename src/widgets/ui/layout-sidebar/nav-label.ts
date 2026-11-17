// The accessible name of a sidebar section link. The «new» badge and the count
// are visual only; the name carries the same facts.
export const navLinkLabel = (title: string, count: number, fresh = 0): string => {
  if (count <= 0) return title
  const total = `${count} ${count === 1 ? 'event' : 'events'}`
  return fresh > 0 ? `${title}, ${fresh} new, ${total}` : `${title}, ${total}`
}
