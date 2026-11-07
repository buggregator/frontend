import type { TUpdateCheck } from '../../types'

// What the UI shows about a newer server release: set only after the server's
// first successful check against GitHub, so an offline machine, a dev build,
// a server with the check off or an older server show nothing.
export type UpdateInfo = {
  current: string
  latest: string
  url: string
  available: boolean
}

export const toUpdateInfo = (raw: TUpdateCheck | null | undefined): UpdateInfo | null => {
  if (!raw?.latest || !raw.url || !/^https?:\/\//i.test(raw.url)) {
    return null
  }

  return {
    current: raw.current,
    latest: raw.latest,
    url: raw.url,
    available: raw.available === true,
  }
}
