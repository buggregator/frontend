import type { BroadcastEvent, BroadcastPayload } from '../types'

// Shapes as the server stores them (server modules/broadcast/handler.go,
// testdata/pusher-php-7.3.0.json), with a Laravel shop's names.

const T0 = 1795279331 // 14:02:11 UTC-ish

const payload = (over: Partial<BroadcastPayload>): BroadcastPayload => {
  const data = over.data ?? '{}'
  let parsed: unknown
  let isJson = true
  try {
    parsed = JSON.parse(data)
  } catch {
    isJson = false
  }
  const channels = over.channels ?? ['orders']
  return {
    app_id: 'shop',
    name: 'OrderShipped',
    channels,
    channel_kinds: channels.map((c) =>
      c.startsWith('private-encrypted-')
        ? 'encrypted'
        : c.startsWith('private-')
          ? 'private'
          : c.startsWith('presence-')
            ? 'presence'
            : c.startsWith('#server-to-user-')
              ? 'user'
              : 'public'
    ),
    data,
    ...(isJson ? { data_json: parsed } : {}),
    auth_key: 'local',
    signature: 'not_checked',
    size: new TextEncoder().encode(data).length,
    warnings: [],
    library: 'pusher-http-php 7.3.0',
    ...over
  }
}

const event = (uuid: string, timestamp: number, over: Partial<BroadcastPayload>): BroadcastEvent => ({
  uuid,
  type: 'broadcast',
  project: 'default',
  timestamp,
  payload: payload(over)
})

export const broadcastOrderStatusPrevMock = event('bc-0001', T0 - 211.37, {
  name: 'OrderStatusUpdated',
  channels: ['private-orders.42'],
  data: '{"order":{"id":42,"status":"packed","tracking":null,"items":3},"updated_by":7}'
})

export const broadcastOrderStatusMock = event('bc-0002', T0 + 0.482, {
  name: 'OrderStatusUpdated',
  channels: ['private-orders.42'],
  data: '{"order":{"id":42,"status":null,"tracking":"1Z999AA10123456784","items":3},"updated_by":7}',
  socket_id: '2183.441'
})

export const broadcastMultiChannelMock = event('bc-0003', T0 + 0.479, {
  name: 'OrderShipped',
  channels: ['private-orders.42', 'private-App.Models.User.7', 'presence-support.3', 'admin'],
  data: '{"order_id":42,"carrier":"UPS","eta":"2026-11-24"}',
  batch_id: 'b-1',
  batch_size: 2,
  upstream: { url: 'http://127.0.0.1:8080', status: 200, time_ms: 12 }
})

export const broadcastInvalidJsonMock = event('bc-0004', T0 - 129.4, {
  name: 'CartUpdated',
  channels: ['private-cart.9f2c1a'],
  data: '{"items":3,"total":59.90,"currency":"EUR"',
  signature: 'invalid',
  warnings: [
    'data is not JSON: Laravel Echo cannot parse it',
    'signature or body hash does not match the configured secret: the app\'s secret differs, or the body changed on the way'
  ]
})

export const broadcastEncryptedMock = event('bc-0005', T0 - 76.3, {
  name: 'PaymentCaptured',
  channels: ['private-encrypted-payments.42'],
  data: '{"nonce":"uU1XQZCMGfKCSVBcgfUgukco+vFu3L6y","ciphertext":"AUfrv8/UWMxplGhU/FY44I1t0uUEdVxwh/BIfIvfBg=="}',
  encrypted: true
})

export const broadcastUpstreamDownMock = event('bc-0006', T0 - 58.1, {
  name: 'Notify',
  channels: ['#server-to-user-7'],
  data: '{"msg":"hi"}',
  upstream: { url: 'http://127.0.0.1:8080', time_ms: 3, error: 'connect: connection refused' }
})

export const broadcastProductsMocks: BroadcastEvent[] = Array.from({ length: 6 }, (_, i) =>
  event(`bc-01${i}`, T0 - 31 + i, {
    name: 'StockChanged',
    channels: [`products.${118 + i}`],
    data: `{"sku":"TSHIRT-${i}","stock":${i}}`
  })
)

export const broadcastMocks: BroadcastEvent[] = [
  broadcastOrderStatusMock,
  broadcastMultiChannelMock,
  ...broadcastProductsMocks,
  broadcastUpstreamDownMock,
  broadcastEncryptedMock,
  broadcastInvalidJsonMock,
  broadcastOrderStatusPrevMock
]
