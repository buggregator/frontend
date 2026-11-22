import type { RouteLocationRaw } from 'vue-router'

// icon: a name of IconSvg; the #icon slot draws any other icon.
// to: the route of a tab in the link mode (as="link").
export type TabItem = {
  id: string
  label: string
  icon?: string
  count?: number | null
  disabled?: boolean
  to?: RouteLocationRaw
}

// The id of a tab button, for its panel's aria-labelledby.
export const tabIdOf = (panelId: string, tab: string) => `${panelId}-tab-${tab}`
