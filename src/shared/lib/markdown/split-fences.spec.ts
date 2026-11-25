import { describe, expect, it } from 'vitest'
import { splitFences } from './split-fences'

describe('splitFences', () => {
  it('keeps plain prose as one segment', () => {
    expect(splitFences('**Cause**: x\n\n- a\n- b')).toEqual([{ kind: 'prose', text: '**Cause**: x\n\n- a\n- b' }])
  })

  it('takes fenced blocks out with their language', () => {
    const t = 'Fix:\n```js\nconst a = 1\n\nfoo()\n```\nThen test.\n~~~\nplain\n~~~'
    expect(splitFences(t)).toEqual([
      { kind: 'prose', text: 'Fix:' },
      { kind: 'code', language: 'js', code: 'const a = 1\n\nfoo()' },
      { kind: 'prose', text: 'Then test.' },
      { kind: 'code', language: '', code: 'plain' }
    ])
  })

  it('needs the same fence to close; an unclosed block runs to the end', () => {
    expect(splitFences('````md\n```\ninner\n```\n````')).toEqual([
      { kind: 'code', language: 'md', code: '```\ninner\n```' }
    ])
    expect(splitFences('a\r\n```py\r\nx = 1')).toEqual([
      { kind: 'prose', text: 'a' },
      { kind: 'code', language: 'py', code: 'x = 1' }
    ])
  })
})
