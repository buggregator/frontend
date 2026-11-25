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

  it('does not open a fence on ```js``` (a backtick info string is inline code)', () => {
    expect(splitFences('Run ```js``` here\nnext')).toEqual([{ kind: 'prose', text: 'Run ```js``` here\nnext' }])
  })

  it('takes a fence out of a list item and strips the item indent from its lines', () => {
    const t = '1. Fix it:\n\n    ```php\n    if ($a) {\n        b();\n    }\n    ```\n2. Test'
    expect(splitFences(t)).toEqual([
      { kind: 'prose', text: '1. Fix it:\n' },
      { kind: 'code', language: 'php', code: 'if ($a) {\n    b();\n}' },
      { kind: 'prose', text: '2. Test' }
    ])
  })
})
