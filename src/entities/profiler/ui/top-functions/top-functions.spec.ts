import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TopFunctions from './top-functions.vue'

const getTopFunctions = vi.fn()

vi.mock('../../lib', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useProfiler: () => ({ getTopFunctions }),
}))
vi.mock('../../ui', () => ({ StatBoard: { template: '<div />' } }))

const schema = [
  { key: 'function', label: 'Function', description: '', sortable: false, values: [{ key: 'function', format: 'string' }] },
  { key: 'ct', label: 'CT', description: 'Calls', sortable: true, values: [{ key: 'ct', format: 'number' }] },
  { key: 'excl_wt', label: 'WT excl.', description: '', sortable: true, values: [{ key: 'excl_wt', format: 'ms' }] },
]
// What an older server returns: biggest first, whatever `order` says.
const functions = [
  { function: 'big', ct: 50, excl_wt: 1 },
  { function: 'mid', ct: 5, excl_wt: 2 },
  { function: 'small', ct: 1, excl_wt: 3 },
]

const mountTable = async () => {
  const wrapper = mount(TopFunctions, { props: { id: 'p1' } })
  await flushPromises()
  return wrapper
}
const header = (wrapper: Awaited<ReturnType<typeof mountTable>>, label: string) =>
  wrapper.findAll('th').find((th) => th.text().startsWith(label))!
const firstColumn = (wrapper: Awaited<ReturnType<typeof mountTable>>) =>
  wrapper.findAll('.top-fn__row').map((row) => row.find('.top-fn__td').text())

describe('TopFunctions: sorting (frontend#280)', () => {
  beforeEach(() => {
    getTopFunctions.mockReset()
    getTopFunctions.mockResolvedValue({ functions, schema, overall_totals: { cpu: 0, wt: 0, mu: 0, pmu: 0, ct: 0 } })
  })

  it('sorts the active column both ways on repeated clicks', async () => {
    const wrapper = await mountTable()

    await header(wrapper, 'CT').find('button').trigger('click')
    await flushPromises()
    expect(getTopFunctions).toHaveBeenLastCalledWith('p1', expect.objectContaining({ metric: 'ct', order: 'desc' }))
    expect(firstColumn(wrapper)).toEqual(['big', 'mid', 'small'])
    expect(header(wrapper, 'CT').attributes('aria-sort')).toBe('descending')

    await header(wrapper, 'CT').find('button').trigger('click')
    await flushPromises()
    expect(getTopFunctions).toHaveBeenLastCalledWith('p1', expect.objectContaining({ metric: 'ct', order: 'asc' }))
    expect(firstColumn(wrapper)).toEqual(['small', 'mid', 'big'])
    expect(header(wrapper, 'CT').attributes('aria-sort')).toBe('ascending')
  })

  it('sortable headers are buttons, the function column is not', async () => {
    const wrapper = await mountTable()

    expect(header(wrapper, 'CT').find('button').exists()).toBe(true)
    expect(header(wrapper, 'Function').find('button').exists()).toBe(false)
    expect(header(wrapper, 'CT').attributes('aria-sort')).toBe('none')
    expect(header(wrapper, 'WT excl.').attributes('aria-sort')).toBe('descending')
  })
})
