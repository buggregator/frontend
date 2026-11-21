import { ref } from 'vue'
import { useCodeGraphRequests } from './use-code-graph-requests'

const enabled = ref(false)
let asked = false

// Whether the server has code graph roots: asked once per page load, for the
// menu item and the frame buttons. Off or an older server → hidden.
export const useCodeGraphEnabled = () => {
  if (!asked) {
    asked = true
    useCodeGraphRequests()
      .getRoots()
      .then((r) => {
        enabled.value = !!r?.enabled
      })
      .catch(() => {
        enabled.value = false
      })
  }
  return enabled
}
