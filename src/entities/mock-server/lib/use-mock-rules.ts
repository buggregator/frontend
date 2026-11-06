import { computed, ref } from 'vue'
import type { MockRule, MockRuleInput } from '../types'
import { useMockRequests } from './use-mock-requests'
import type { LoadState } from './use-mock-traffic'

export const toInput = (rule: MockRule): MockRuleInput => ({
  project: rule.project,
  name: rule.name,
  method: rule.method,
  path: rule.path,
  status: rule.status,
  headers: { ...rule.headers },
  body: rule.body,
  delay_ms: rule.delay_ms,
  enabled: rule.enabled,
})

// Rules in match order (yaml rules first, read-only). Writes go to the server
// and the list is replaced by what the server answers.
export const useMockRules = () => {
  const api = useMockRequests()

  const rules = ref<MockRule[]>([])
  const state = ref<LoadState>('loading')

  const configRules = computed(() => rules.value.filter((r) => r.read_only))
  const ownRules = computed(() => rules.value.filter((r) => !r.read_only))

  const load = async () => {
    state.value = 'loading'
    try {
      rules.value = await api.getRules()
      state.value = 'ready'
    } catch {
      state.value = 'error'
    }
  }

  const refresh = async () => {
    rules.value = await api.getRules()
  }

  const save = async (id: string | null, input: MockRuleInput): Promise<MockRule> => {
    const rule = id ? await api.updateRule(id, input) : await api.createRule(input)
    await refresh()
    return rule
  }

  const remove = async (id: string) => {
    await api.deleteRule(id)
    rules.value = rules.value.filter((r) => r.id !== id)
  }

  const toggle = async (rule: MockRule) => {
    const updated = await api.updateRule(rule.id, { ...toInput(rule), enabled: !rule.enabled })
    rules.value = rules.value.map((r) => (r.id === rule.id ? updated : r))
  }

  // Moves an editable rule one place up (-1) or down (+1) among editable rules.
  const move = async (id: string, delta: -1 | 1) => {
    const ids = ownRules.value.map((r) => r.id)
    const from = ids.indexOf(id)
    const to = from + delta
    if (from < 0 || to < 0 || to >= ids.length) return

    ids.splice(to, 0, ...ids.splice(from, 1))
    rules.value = await api.reorderRules(ids)
  }

  return { rules, state, configRules, ownRules, load, save, remove, toggle, move }
}
