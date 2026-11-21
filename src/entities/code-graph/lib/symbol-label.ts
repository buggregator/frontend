// How a symbol reads on a node and in lists: the call name and what owns it
// (class or type for methods, namespace or package for the rest).

type Labelled = { kind: string; name: string; fqn: string }

const CALLABLE = new Set(['method', 'function', 'external'])

export const fileBase = (path: string) => path.split(/[\\/]/).pop() ?? path

const lastPart = (s: string) => s.split(/[\\/]/).pop() ?? s

export const symbolLabel = ({ kind, name, fqn }: Labelled): { name: string; owner: string } => {
  if (kind === 'file') {
    const parts = name.split(/[\\/]/)
    return { name: parts.pop() ?? name, owner: parts.join('/') }
  }

  let owner: string
  let call = name
  if (fqn.includes('::')) {
    // PHP: App\Clients\OrdersClient::create
    const [cls, member] = fqn.split('::')
    owner = lastPart(cls)
    call = member || name
  } else if (kind === 'method') {
    // Go: example.com/app/orders.(*Service).Create or .S.Save
    const tail = lastPart(fqn)
    const parts = tail.split('.')
    call = parts.pop() || name
    owner = (parts.pop() ?? '').replace(/^\(\*?|\)$/g, '')
  } else if (fqn.includes('\\')) {
    owner = fqn.slice(0, fqn.lastIndexOf('\\'))
  } else {
    // Go function or type: example.com/app/cmd.main → package cmd
    const tail = lastPart(fqn)
    const dot = tail.indexOf('.')
    owner = dot > 0 ? tail.slice(0, dot) : ''
  }

  return { name: CALLABLE.has(kind) ? `${call}()` : call, owner }
}
