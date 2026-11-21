import type { RouteLocationRaw } from 'vue-router'
import { RouteName } from '@/shared/types'

// A way into the Code page (#6573 A). `symbol`: a symbol id; `fqn`: a full
// name (ids change on re-index); `file` + `line`: resolved by the page, for
// stack frames, spans and profiler functions. `from` names where the person
// came from («OrderFailedException»), `back` is that page's path.
export type CodeLinkQuery = {
  symbol?: number
  fqn?: string
  root?: string
  file?: string
  line?: number
  from?: string
  back?: string
}

export const codeLink = (query: CodeLinkQuery = {}): RouteLocationRaw => ({
  name: RouteName.Code,
  query: Object.fromEntries(
    Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)])
  )
})
