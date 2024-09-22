import type { Meta, StoryObj } from '@storybook/vue3'
import { useRay } from '../../lib'
import { rayMeasureMock, rayMeasureStartMock } from '../../mocks'
import type { RayContentMeasure } from '../../types'
import RayMeasure from './ray-measure.vue'

const { normalizeRayEvent } = useRay()

export default {
  title: 'Entities/ray/RayMeasure',
  component: RayMeasure
} as Meta<typeof RayMeasure>

export const Default: StoryObj<typeof RayMeasure> = {
  args: {
    measure: normalizeRayEvent(rayMeasureMock).payload.payloads[0].content as RayContentMeasure
  }
}

export const Start: StoryObj<typeof RayMeasure> = {
  args: {
    measure: normalizeRayEvent(rayMeasureStartMock).payload.payloads[0].content as RayContentMeasure
  }
}
