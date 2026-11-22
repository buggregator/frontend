import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SmtpInviteCard from './smtp-invite-card.vue'

// The invite comes from any mail sent to Buggregator: its URL and LOCATION are
// untrusted. Only http(s) becomes a link; `javascript:` would run in our origin.
describe('SmtpInviteCard: links (#6829)', () => {
  it.each([
    ['url', 'javascript:fetch("/api/events")'],
    ['url', 'data:text/html,<script>1</script>'],
    ['location', 'javascript:alert(1)'],
  ])('%s %s is text, not a link', (field, value) => {
    const wrapper = mount(SmtpInviteCard, { props: { calendar: { summary: 'x', [field]: value } } })
    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.text()).toContain(value)
  })

  it('an https URL is a link that opens a new tab', () => {
    const wrapper = mount(SmtpInviteCard, { props: { calendar: { summary: 'x', url: 'https://meet.example.com/abc' } } })
    const a = wrapper.get('a')
    expect(a.attributes('href')).toBe('https://meet.example.com/abc')
    expect(a.attributes('rel')).toContain('noopener')
  })
})
