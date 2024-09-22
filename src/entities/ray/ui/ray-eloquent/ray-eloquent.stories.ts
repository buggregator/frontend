import type { Meta, StoryObj } from '@storybook/vue3'
import { useRay } from '../../lib'
import { rayLaravelEloquentMock } from '../../mocks-laravel'
import type { RayContentEloquent } from '../../types'
import RayEloquent from './ray-eloquent.vue'

const { normalizeRayEvent } = useRay()

export default {
  title: 'Entities/ray/RayEloquent',
  component: RayEloquent
} as Meta<typeof RayEloquent>

export const Default: StoryObj<typeof RayEloquent> = {
  args: {
    content: normalizeRayEvent(rayLaravelEloquentMock).payload.payloads[0]
      .content as RayContentEloquent
  }
}
