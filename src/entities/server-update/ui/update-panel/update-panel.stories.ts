import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { action } from 'storybook/actions'
import { updateStatusMocks } from '../../mocks'
import UpdatePanel from './update-panel.vue'

const NOW = Date.parse('2026-11-17T10:00:00Z')

export default {
  title: 'Entities/ServerUpdate/UpdatePanel',
  component: UpdatePanel,
  args: {
    loadedVersion: '2.9.0',
    now: NOW,
    onCheck: action('check'),
    onStart: action('start'),
    onReload: action('reload')
  }
} as Meta<typeof UpdatePanel>

type Story = StoryObj<typeof UpdatePanel>

export const UpToDate: Story = { args: { status: updateStatusMocks.upToDate, loadedVersion: '2.10.0' } }
export const NeverChecked: Story = { args: { status: updateStatusMocks.neverChecked } }
export const Checking: Story = { args: { status: updateStatusMocks.upToDate, loadedVersion: '2.10.0', checking: true } }
export const CheckTooEarly: Story = {
  args: {
    status: updateStatusMocks.upToDate,
    loadedVersion: '2.10.0',
    checkMessage: 'Checked less than a minute ago. Try again in 42 s.'
  }
}
export const Available: Story = { args: { status: updateStatusMocks.available } }
export const AvailableMemoryDb: Story = { args: { status: updateStatusMocks.memoryDb } }
export const StartRefused: Story = {
  args: { status: updateStatusMocks.available, actionError: 'An update is already running. Its progress is shown here.' }
}
export const Downloading: Story = { args: { status: updateStatusMocks.downloading } }
export const Verifying: Story = { args: { status: updateStatusMocks.verifying } }
export const Installing: Story = { args: { status: updateStatusMocks.installing } }
export const Restarting: Story = { args: { status: updateStatusMocks.restarting } }
export const RestartTooLong: Story = { args: { status: updateStatusMocks.restarting, restartGaveUp: true } }
export const Done: Story = { args: { status: updateStatusMocks.done, loadedVersion: '2.10.0' } }
export const Failed: Story = { args: { status: updateStatusMocks.failed } }
export const RolledBack: Story = { args: { status: updateStatusMocks.rolledBack } }
export const RestartRequired: Story = { args: { status: updateStatusMocks.restartRequired } }
export const ManualDocker: Story = { args: { status: updateStatusMocks.docker } }
export const Off: Story = { args: { status: updateStatusMocks.off } }
