// The accessible name of a sidebar section link. The dot and the count badge
// are visual only; the name carries the same fact.
export const navLinkLabel = (title: string, count: number): string =>
  count > 0 ? `${title}, ${count} ${count === 1 ? 'event' : 'events'}` : title
