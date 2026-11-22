import { describe, expect, it } from 'vitest'
import { nextSort, sortFunctions } from './top-functions-sort'

const rows = [
  { function: 'a', ct: 5 },
  { function: 'b', ct: 50 },
  { function: 'c', ct: 1 },
] as never[]

const names = (list: { function: string }[]) => list.map((r) => r.function)

describe('top functions sort (frontend#280)', () => {
  it('a new column starts with the biggest first', () => {
    expect(nextSort({ key: 'excl_wt', order: 'desc' }, 'ct')).toEqual({ key: 'ct', order: 'desc' })
    expect(nextSort({ key: 'excl_wt', order: 'asc' }, 'ct')).toEqual({ key: 'ct', order: 'desc' })
  })

  it('the active column flips its order on every click', () => {
    const once = nextSort({ key: 'ct', order: 'desc' }, 'ct')
    expect(once).toEqual({ key: 'ct', order: 'asc' })
    expect(nextSort(once, 'ct')).toEqual({ key: 'ct', order: 'desc' })
  })

  it('sorts rows both ways without touching the input', () => {
    expect(names(sortFunctions(rows, { key: 'ct', order: 'desc' }))).toEqual(['b', 'a', 'c'])
    expect(names(sortFunctions(rows, { key: 'ct', order: 'asc' }))).toEqual(['c', 'a', 'b'])
    expect(names(rows)).toEqual(['a', 'b', 'c'])
  })
})
