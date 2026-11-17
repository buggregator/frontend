import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useEventsStore, useSettingsStore } from '@/shared/stores'
import { pageHttpPort, resolveValues } from './fill'
import content from './setup-help.json'
import type { SetupContent } from './types'
import { pageHost, useSetupHost } from './use-setup-prefs'

// This server's values for the setup samples: host, ports and project (#5941).
// One place for the setup help and the channel panel (#6012).
// HTTP: the port the browser reached this server through — the page's own
// port, or the scheme's behind a reverse proxy (pageHttpPort); /api/settings
// gives the container's listen port. A host typed by hand keeps the server's port.
export const useSetupValues = () => {
  const { defaults } = content as SetupContent
  const { ports } = storeToRefs(useSettingsStore())
  const { activeProject } = storeToRefs(useEventsStore())
  const { storedHost } = useSetupHost()

  const host = computed(() => storedHost.value || pageHost())
  const pageHttp = computed(() => (storedHost.value ? null : pageHttpPort(window.location)))

  const resolved = computed(() => {
    const r = resolveValues({
      host: host.value,
      projectKey: activeProject.value?.key ?? '',
      ports: ports.value,
      defaults
    })
    if (pageHttp.value) {
      r.values.http_port = pageHttp.value.port
      r.defaulted.delete('http_port')
      r.off.delete('http_port')
    }
    return r
  })

  return { host, pageHttp, resolved, values: computed(() => resolved.value.values) }
}
