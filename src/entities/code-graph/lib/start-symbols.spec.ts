import { describe, expect, it } from 'vitest'
import type { CodeGraph, CodeGraphNode } from '../types'
import { isEntryPoint, startSymbols } from './start-symbols'

const n = (id: number, fqn: string, extra: Partial<CodeGraphNode> = {}): CodeGraphNode => ({
  id: `s:${id}`,
  symbol_id: id,
  kind: 'method',
  name: fqn.split(/::|\./).pop()!,
  fqn,
  file: 'src/a.php',
  depth: 0,
  ...extra
})

describe('startSymbols', () => {
  const graph: CodeGraph = {
    nodes: [
      n(1, 'App\\Services\\CheckoutService::placeOrder'),
      n(2, 'App\\Http\\CartController::checkout'),
      n(3, 'App\\Clients\\OrdersClient::create'),
      n(4, 'App\\Clients\\OrdersClient', { kind: 'class' }),
      n(5, 'x.TestSomething', { kind: 'function', name: 'TestSomething', file: 'a_test.go' }),
      n(6, 'Guzzle\\Client::post', { external: true })
    ],
    edges: [
      { from: 's:2', to: 's:1', kind: 'calls', confidence: 'exact', count: 1 },
      { from: 's:1', to: 's:3', kind: 'calls', confidence: 'exact', count: 3 },
      { from: 's:5', to: 's:3', kind: 'calls', confidence: 'exact', count: 9 },
      { from: 's:3', to: 's:6', kind: 'calls', confidence: 'exact', count: 1 }
    ],
    truncated: true
  }

  it('puts entry points first, then the most linked; no types, tests or outside code', () => {
    expect(startSymbols(graph).map((s) => s.node.symbol_id)).toEqual([2, 3, 1])
  })

  it('handles no graph', () => {
    expect(startSymbols(null)).toEqual([])
  })
})

describe('isEntryPoint', () => {
  it.each([
    ['main.main', true],
    ['App\\Http\\CartController::checkout', true],
    ['App\\Http\\CallAction::__invoke', true],
    ['github.com/x/srv.api.ServeHTTP', true],
    ['App\\Services\\CheckoutService::placeOrder', false]
  ])('%s → %s', (fqn, want) => {
    expect(isEntryPoint(n(1, fqn, { name: fqn.split(/::|\./).pop()! }))).toBe(want)
  })
})
