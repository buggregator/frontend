import type { Meta, StoryObj } from '@storybook/vue3'
import type { ComponentProps } from 'vue-component-type-helpers'
import { httpDumpMock } from '@/entities/http-dump/mocks'
import { inspectorMock } from '@/entities/inspector/mocks'
import { monologMock } from '@/entities/monolog/mocks'
import { profilerMock } from '@/entities/profiler/mocks'
import { sentrySpiralMock } from '@/entities/sentry/mocks'
import { smtpWelcomeMock } from '@/entities/smtp/mocks'
import { varDumpObjectMock } from '@/entities/var-dump/mocks'
import EventCardMapper from './event-card-mapper.vue'

export default {
  title: 'Widgets/EventCardMapper',
  component: EventCardMapper
} as Meta<typeof EventCardMapper>

export const Default: StoryObj<typeof EventCardMapper> = {
  args: {
    event: { ...smtpWelcomeMock, type: 'unknown' }
  }
}

export const Monolog: StoryObj<typeof EventCardMapper> = {
  args: {
    event: monologMock
  }
}

export const Sentry: StoryObj<typeof EventCardMapper> = {
  args: {
    event: sentrySpiralMock
  }
}

export const Smtp: StoryObj<typeof EventCardMapper> = {
  args: {
    event: smtpWelcomeMock
  }
}

export const VarDump: StoryObj<typeof EventCardMapper> = {
  args: {
    event: varDumpObjectMock
  }
}

export const Profiler: StoryObj<typeof EventCardMapper> = {
  args: {
    event: profilerMock
  }
}

export const Inspector: StoryObj<typeof EventCardMapper> = {
  args: {
    event: inspectorMock
  }
}

export const HttpDump: StoryObj<typeof EventCardMapper> = {
  args: {
    event: httpDumpMock
  }
}

const eventsList = [
  monologMock,
  sentrySpiralMock,
  smtpWelcomeMock,
  varDumpObjectMock,
  profilerMock,
  inspectorMock,
  httpDumpMock
]

export const EventsList = {
  args: {
    event: inspectorMock
  },
  render: (args: ComponentProps<typeof EventCardMapper>) => ({
    components: { EventCardMapper },
    setup() {
      return {
        args,
        eventsList
      }
    },
    template: `<EventCardMapper class="border-b" v-for="event in eventsList" :event="event" :key="event.uuid"/>`
  })
}

export const EventsListVirtual: StoryObj<typeof EventCardMapper> = {
  args: {
    event: inspectorMock
  },
  render: (args: ComponentProps<typeof EventCardMapper>) => ({
    components: { EventCardMapper },
    setup() {
      return {
        args,
        eventsList: eventsList
          .concat(eventsList)
          .concat(eventsList)
          .concat(eventsList)
          .concat(eventsList)
          .concat(eventsList)
          .map((item, index) => ({ ...item, uuid: String(index + 1) })) // make uniq ids
          .sort(() => Math.random() - 0.5) // shuffle
      }
    },
    template: `
    <template v-for="item in eventsList">
      <EventCardMapper class="border-b" :event="item" />
    </template>
  `
  })
}
