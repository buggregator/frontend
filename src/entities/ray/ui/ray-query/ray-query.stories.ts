import type { Meta, StoryObj } from '@storybook/vue3'
import { useRay } from '../../lib'
import { rayLaravelQueryMock, rayLaravelQueryNoBindingsMock } from '../../mocks-laravel'
import type { RayContentSQL } from '../../types'
import RayQuery from './ray-query.vue'

const { normalizeRayEvent } = useRay()

export default {
  title: 'Entities/ray/RayQuery',
  component: RayQuery
} as Meta<typeof RayQuery>

export const Default: StoryObj<typeof RayQuery> = {
  args: {
    content: normalizeRayEvent(rayLaravelQueryMock).payload.payloads[0].content as RayContentSQL
  }
}

export const NoBindings: StoryObj<typeof RayQuery> = {
  args: {
    content: normalizeRayEvent(rayLaravelQueryNoBindingsMock).payload.payloads[0]
      .content as RayContentSQL
  }
}
