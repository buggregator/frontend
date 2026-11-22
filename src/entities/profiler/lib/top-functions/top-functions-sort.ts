export type SortOrder = 'asc' | 'desc'

export type TopFunctionsSort = {
  key: string
  order: SortOrder
}

// A new column starts with the biggest values; the active one flips (frontend#280).
export const nextSort = (current: TopFunctionsSort, key: string): TopFunctionsSort => (
  current.key === key
    ? { key, order: current.order === 'desc' ? 'asc' : 'desc' }
    : { key, order: 'desc' }
)

// The server picks the rows; this keeps them in the chosen order also when the
// server ignores `order` (older servers sort biggest first only).
export const sortFunctions = <T extends object>(rows: T[], { key, order }: TopFunctionsSort): T[] => {
  const sign = order === 'asc' ? 1 : -1
  const value = (row: T) => Number((row as Record<string, unknown>)[key]) || 0

  return [...rows].sort((a, b) => sign * (value(a) - value(b)))
}
