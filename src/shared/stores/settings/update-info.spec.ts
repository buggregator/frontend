import { describe, expect, it } from 'vitest'
import { toUpdateInfo } from './update-info'

const checked = {
  current: '2.7.0',
  latest: '2.8.0',
  url: 'https://github.com/buggregator/server/releases/tag/v2.8.0',
  available: true,
  checked_at: '2026-11-07T14:40:39Z',
}

describe('toUpdateInfo', () => {
  it('gives the newer release when one is available', () => {
    expect(toUpdateInfo(checked)).toEqual({
      current: '2.7.0',
      latest: '2.8.0',
      url: 'https://github.com/buggregator/server/releases/tag/v2.8.0',
      available: true,
    })
  })

  it('says up to date when the check ran and nothing is newer', () => {
    expect(toUpdateInfo({ ...checked, latest: '2.7.0', available: false })).toMatchObject({
      latest: '2.7.0',
      available: false,
    })
  })

  it('gives nothing when the check is off or the server is older', () => {
    expect(toUpdateInfo(null)).toBeNull()
    expect(toUpdateInfo(undefined)).toBeNull()
  })

  it('gives nothing before the first successful check', () => {
    expect(toUpdateInfo({ current: '2.7.0', available: false })).toBeNull()
  })

  it('does not offer a link that is not http(s)', () => {
    expect(toUpdateInfo({ ...checked, url: 'javascript:alert(1)' })).toBeNull()
  })
})
