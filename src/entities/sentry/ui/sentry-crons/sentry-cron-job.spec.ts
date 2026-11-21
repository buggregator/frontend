import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { CronCheckIn, CronMonitor } from '../../types'
import SentryCronJob from './sentry-cron-job.vue'

const now = Date.parse('2026-11-21T14:12:00Z')
const ago = (min: number) => new Date(now - min * 60_000).toISOString()

const monitor = (over: Partial<CronMonitor> = {}): CronMonitor => ({
  project: 'shop',
  slug: 'orders-sync',
  source: 'sentry',
  schedule: { type: 'crontab', value: '*/5 * * * *' },
  timezone: 'UTC',
  checkin_margin: 1,
  max_runtime: 2,
  last_status: 'error',
  last_checkin_at: ago(2),
  next_expected_at: ago(-3),
  created_at: ago(600),
  recent: [
    { status: 'error', started_at: ago(2) },
    { status: 'ok', started_at: ago(7) }
  ],
  ...over
})

const checkIn = (id: string, over: Partial<CronCheckIn> = {}): CronCheckIn => ({
  id,
  status: 'ok',
  started_at: ago(7),
  finished_at: ago(7),
  duration_ms: 2300,
  environment: 'local',
  trace_id: '',
  source: 'sentry',
  body: '',
  server_made: false,
  expected_at: null,
  ...over
})

const render = (props: Partial<InstanceType<typeof SentryCronJob>['$props']> = {}) =>
  mount(SentryCronJob, {
    props: {
      monitor: monitor(),
      checkins: [
        checkIn('1', { status: 'error', started_at: '2026-11-21T14:10:00.000Z', duration_ms: 8400, trace_id: 'abc', body: 'cURL error 28' }),
        checkIn('2', { started_at: '2026-11-21T14:05:00.000Z' })
      ],
      now,
      ...props
    },
    global: { stubs: { RouterLink: RouterLinkStub } }
  })

describe('SentryCronJob', () => {
  it('the head: name, status, schedule, margin, max runtime, environment, source', () => {
    const text = render().get('header').text()
    expect(text).toContain('orders-sync')
    expect(text).toContain('Failed')
    expect(text).toContain('Every 5 minutes')
    expect(text).toContain('margin 1 min')
    expect(text).toContain('max runtime 2 min')
    expect(text).toContain('env local')
    expect(text).toContain('Sentry SDK')
  })

  it('says what is wrong in words', () => {
    expect(render().get('[data-test="cron-explain"]').text()).toContain('Last run failed 2 min ago.')
  })

  it('no frame when all is well', () => {
    const w = render({ monitor: monitor({ last_status: 'ok', recent: [{ status: 'ok', started_at: ago(2) }] }) })
    expect(w.find('[data-test="cron-explain"]').exists()).toBe(false)
  })

  it('check-ins: time, status, duration, reason, the trace link', () => {
    const rows = render().findAll('[data-test="cron-checkin"]')
    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('14:10:00')
    expect(rows[0].text()).toContain('Failed')
    expect(rows[0].text()).toContain('8.4 s')
    expect(rows[0].text()).toContain('cURL error 28')
    expect(rows[0].getComponent(RouterLinkStub).props('to')).toEqual({
      name: 'sentry-trace-detail',
      params: { traceId: 'abc' }
    })
    expect(rows[1].findComponent(RouterLinkStub).exists()).toBe(false)
  })

  it('a missed slot shows the expected time and no duration', () => {
    const w = render({
      checkins: [checkIn('m', { status: 'missed', server_made: true, expected_at: '2026-11-21T02:30:00.000Z', started_at: '2026-11-21T02:30:00.000Z', duration_ms: null })]
    })
    const row = w.get('[data-test="cron-checkin"]')
    expect(row.text()).toContain('02:30')
    expect(row.text()).toContain('Missed')
    expect(row.text()).toContain('No check-in by 02:31')
  })

  it('four numbers', () => {
    const text = render().get('.cron-job__kpis').text()
    expect(text).toContain('runs OK (last 2)')
    expect(text).toContain('1 / 2')
    expect(text).toContain('8.4 s')
    expect(text).toContain('in 3 min')
  })

  it('runs OK leaves «Missed?» slots out, the label names what is loaded', () => {
    const text = render({
      checkins: [checkIn('1'), checkIn('2', { status: 'unknown', duration_ms: null, server_made: true })]
    })
      .get('.cron-job__kpis')
      .text()
    expect(text).toContain('runs OK (last 2)')
    expect(text).toContain('1 / 1')
  })

  it('no check-ins yet: a compact status panel', () => {
    const panel = render({ checkins: [] }).get('[data-test="cron-no-checkins"]')
    expect(panel.classes()).toContain('status-panel--compact')
    expect(panel.text()).toContain('No check-ins yet')
  })

  it('«Show older check-ins» asks for more', async () => {
    const w = render({ hasOlder: true })
    await w.get('.cron-job__more-btn').trigger('click')
    expect(w.emitted('loadOlder')).toHaveLength(1)
    expect(render().find('.cron-job__more-btn').exists()).toBe(false)
  })

  it('a ping job without a schedule: how to give it one, and its ping URLs', () => {
    const w = render({ monitor: monitor({ source: 'ping', schedule: null, next_expected_at: null }) })
    expect(w.get('[data-test="cron-no-schedule"]').text()).toContain('?schedule=*%2F5%20*%20*%20*%20*&margin=1&max_runtime=30')
    const ping = w.get('[data-test="cron-ping-urls"]')
    expect(ping.classes()).toContain('code-snippet')
    expect(ping.text()).toContain('/ping/orders-sync/start?project=shop')
    expect(ping.find('button[aria-label="Copy code"]').exists()).toBe(true)
  })

  it('panels use the shared section heading', () => {
    const titles = render({ monitor: monitor({ source: 'ping' }) })
      .findAll('.event-section__title')
      .map((t) => t.text())
    expect(titles).toEqual(['Last 2 runs', 'Check-ins', 'Ping URLs of this job'])
  })

  it('a check-in output opens in a code snippet with Copy', () => {
    const w = render({ checkins: [checkIn('o', { body: 'line one\nline two' })] })
    const out = w.get('.cron-job__output .code-snippet')
    expect(out.text()).toContain('line one')
    expect(out.find('button[aria-label="Copy code"]').exists()).toBe(true)
  })
})
