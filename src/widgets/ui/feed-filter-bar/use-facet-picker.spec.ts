import { describe, expect, it, vi } from 'vitest'
import { useFacetPicker } from './use-facet-picker'

const counts = {
  host: [{ value: 'ci-runner-3', count: 311 }, { value: 'anna-mbp', count: 142 }, { value: 'max-xps', count: 96 }],
  'tag:feature': [{ value: 'checkout_v2', count: 19 }],
}

describe('useFacetPicker', () => {
  it('lists the fields, then tags found on the server, with their value counts', async () => {
    const picker = useFacetPicker(() => Promise.resolve(counts))
    await picker.reload()

    expect(picker.status.value).toBe('ready')
    expect(picker.fields.value.map((f) => f.key)).toEqual(['host', 'env', 'user', 'channel', 'level', 'release', 'tag:feature'])
    expect(picker.fields.value.find((f) => f.key === 'host')?.values).toBe(3)
    expect(picker.fields.value.at(-1)?.label).toBe('Tag: feature')
  })

  it('finds values of the chosen field by text and moves within them', async () => {
    const picker = useFacetPicker(() => Promise.resolve(counts))
    await picker.reload()
    picker.chooseField('host')
    picker.setQuery('R')

    expect(picker.values.value.map((v) => v.value)).toEqual(['ci-runner-3'])

    picker.setQuery('')
    picker.move(-1)
    expect(picker.values.value[picker.active.value]?.value).toBe('max-xps')
    picker.move(1)
    expect(picker.active.value).toBe(0)
  })

  it('says so when the counts could not be loaded', async () => {
    const picker = useFacetPicker(() => Promise.reject(new Error('503')))
    await picker.reload()
    expect(picker.status.value).toBe('error')
  })

  it('keeps only the newest answer', async () => {
    let resolveOld: (v: typeof counts) => void = () => {}
    const load = vi.fn()
      .mockImplementationOnce(() => new Promise((r) => { resolveOld = r }))
      .mockImplementationOnce(() => Promise.resolve({ host: [{ value: 'new', count: 1 }] }))
    const picker = useFacetPicker(load)
    const first = picker.reload()
    await picker.reload()
    resolveOld(counts)
    await first

    expect(picker.facets.value.host?.[0]?.value).toBe('new')
  })
})
