import { describe, expect, it } from 'vitest'
import type { MockFake } from '../types'
import { fakeCategories, fakeSnippet, filterFakes, insertAt, parseHeaderLines } from './mock-template'

const fake = (name: string, category: string, description = '', output = 'string'): MockFake => ({
  name, category, description, example: 'sample', output, params: [],
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

describe('fakeSnippet', () => {
  // The server's `example` is a sample value and `output` the Go type.
  it('writes strings and objects as JSON', () => {
    expect(fakeSnippet(fake('email', 'person'))).toBe('{{ fake "email" | json }}')
    expect(fakeSnippet(fake('person', 'person', '', 'map[string]any'))).toBe('{{ fake "person" | json }}')
    expect(fakeSnippet(fake('words', 'text', '', '[]string'))).toBe('{{ fake "words" | json }}')
  })

  it('writes numbers and bools as they are', () => {
    expect(fakeSnippet(fake('number', 'number', '', 'int'))).toBe('{{ fake "number" }}')
    expect(fakeSnippet(fake('price', 'payment', '', 'float64'))).toBe('{{ fake "price" }}')
    expect(fakeSnippet(fake('bool', 'misc', '', 'bool'))).toBe('{{ fake "bool" }}')
  })
})
