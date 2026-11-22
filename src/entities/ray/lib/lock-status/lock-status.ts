import type { RpcReply } from '@/shared/lib/io'
import type { RayLockState } from '../../types'

/**
 * Where a Ray pause stands, for its card:
 * - active: the script waits for Continue or Stop;
 * - continued / stopped: released, from this tab or another one;
 * - gone: the server does not know the pause (it was restarted), the script
 *   no longer waits.
 */
export type RayLockStatus = 'active' | RayLockState | 'gone'

const isLockState = (v: unknown): v is RayLockState => v === 'continued' || v === 'stopped'

/**
 * The status after a click, from the server's reply to POST /api/ray/locks/{name}:
 * 200 `{state}` → that state (the asked one if missing), 404 → gone.
 * Anything else, or no reply, is null: the click did not land, try again.
 */
export const lockStatusFromReply = (reply: RpcReply | undefined | null, asked: RayLockState): RayLockStatus | null => {
  if (!reply || typeof reply.code !== 'number') {
    return null
  }
  if (reply.code === 404) {
    return 'gone'
  }
  if (reply.code < 200 || reply.code >= 300) {
    return null
  }
  const state = (reply.data as { state?: unknown } | null)?.state
  return isLockState(state) ? state : asked
}
