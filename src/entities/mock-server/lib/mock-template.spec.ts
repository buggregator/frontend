import { describe, expect, it } from 'vitest'
import type { MockFake } from '../types'
import { fakeCategories, filterFakes, insertAt, parseHeaderLines } from './mock-template'

const fake = (name: string, category: string, description = ''): MockFake => ({
  name, category, description, example: `{{ fake "${name}" | json }}`, output: '"x"', params: [],
})

describe('insertAt', () => {
  it('puts the snippet at the cursor and moves the cursor after it', () => {
    expect(insertAt('{"a": }', 6, 6, '{{ path "id" }}')).toEqual({ text: '{"a": {{ path "id" }}}', caret: 21 })
  })

  it('replaces the selected text', () => {
    expect(insertAt('{"a": 1}', 6, 7, '2')).toEqual({ text: '{"a": 2}', caret: 7 })
  })

  it('appends when there is no cursor', () => {
    expect(insertAt('ab', null, null, 'c')).toEqual({ text: 'abc', caret: 3 })
  })
})

describe('filterFakes', () => {
  const list = [fake('name', 'person', 'Full name'), fake('email', 'internet', 'Email address'), fake('city', 'address')]

  it('finds by name or description, any case', () => {
    expect(filterFakes(list, 'MAIL', '').map((f) => f.name)).toEqual(['email'])
    expect(filterFakes(list, 'full', '').map((f) => f.name)).toEqual(['name'])
  })

  it('keeps one category', () => {
    expect(filterFakes(list, '', 'address').map((f) => f.name)).toEqual(['city'])
  })

  it('lists the categories sorted, once each', () => {
    expect(fakeCategories([...list, fake('zip', 'address')])).toEqual(['address', 'internet', 'person'])
  })
})

describe('parseHeaderLines', () => {
  it('reads "Name: value" lines and skips blank ones', () => {
    expect(parseHeaderLines('X-Request-Id: abc\n\nAccept: application/json')).toEqual({
      'X-Request-Id': 'abc',
      Accept: 'application/json',
    })
  })

  it('keeps a colon inside the value and drops lines without a name', () => {
    expect(parseHeaderLines('Referer: http://a/b\n: x\nbroken')).toEqual({ Referer: 'http://a/b' })
  })
})
