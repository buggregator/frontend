import { useRouter, type RouteLocationRaw } from 'vue-router'

// A table row that opens like its link (Crons #6617, Queues #6713): the
// link in the row stays the keyboard target, a click anywhere on the row
// opens it too.
export const useRowLink = () => {
  const router = useRouter()

  return (event: MouseEvent, to: RouteLocationRaw) => {
    // The link handles its own click (new tab included); text being selected
    // is not a click; the right button opens the menu.
    if ((event.target as HTMLElement).closest('a')) return
    if (window.getSelection()?.toString()) return
    if (event.button !== 0 && event.button !== 1) return
    // Ctrl/Cmd/Shift or the middle button on the row: a new tab, as on the link.
    if (event.button === 1 || event.ctrlKey || event.metaKey || event.shiftKey) {
      window.open(router.resolve(to).href, '_blank', 'noopener')
      return
    }
    if (event.altKey) return
    router.push(to)
  }
}
