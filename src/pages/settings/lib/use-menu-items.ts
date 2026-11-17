import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useXdebugEnabled } from '@/entities/xdebug/lib'
import { MENU_ITEMS, MENU_TOOL_IDS, type MenuItem } from '@/shared/constants'
import { useSettingsStore } from '@/shared/stores'

export type MenuItemState = MenuItem & { shown: boolean; locked: boolean }

// Settings › Menu (#5949): the menu entries this server has, which are on, and
// the rule that one of them always stays on.
export const useMenuItems = () => {
  const settingsStore = useSettingsStore()
  const { availableEvents, hiddenMenuItems, isMockServerAvailable } = storeToRefs(settingsStore)
  const xdebugEnabled = useXdebugEnabled()

  const available = computed(() =>
    MENU_ITEMS.filter((item) => {
      if (item.id === MENU_TOOL_IDS.mockServer) return isMockServerAvailable.value
      if (item.id === MENU_TOOL_IDS.xdebug) return xdebugEnabled.value
      return availableEvents.value.includes(item.id)
    })
  )

  const shownCount = computed(
    () => available.value.filter((item) => !hiddenMenuItems.value.includes(item.id)).length
  )

  const items = computed<MenuItemState[]>(() =>
    available.value.map((item) => {
      const shown = !hiddenMenuItems.value.includes(item.id)
      return { ...item, shown, locked: shown && shownCount.value === 1 }
    })
  )

  // In menu order, by group.
  const groups = computed(() => {
    const out: { title: string; items: MenuItemState[] }[] = []
    for (const item of items.value) {
      const last = out[out.length - 1]
      if (last?.title === item.groupTitle) last.items.push(item)
      else out.push({ title: item.groupTitle, items: [item] })
    }
    return out
  })

  const hiddenCount = computed(() => available.value.length - shownCount.value)

  const toggle = (item: MenuItemState) => {
    if (item.locked) return
    settingsStore.setMenuItemHidden(item.id, item.shown)
  }

  return { groups, hiddenCount, toggle, showAll: () => settingsStore.showAllMenuItems() }
}
