import { ref } from 'vue'
import { useXdebugRequests } from './use-xdebug-requests'

const enabled = ref(false)
let asked = false

// Whether the server runs the Xdebug proxy: asked once per page load, for the
// sidebar item. An older server without the module answers 404 → hidden.
export const useXdebugEnabled = () => {
  if (!asked) {
    asked = true
    useXdebugRequests().getConfig()
      .then((config) => { enabled.value = !!config?.enabled })
      .catch(() => { enabled.value = false })
  }
  return enabled
}
