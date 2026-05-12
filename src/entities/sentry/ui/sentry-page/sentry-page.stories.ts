import type { Meta, StoryObj } from "@storybook/vue3-vite";
import type { ServerEvent } from "@/shared/types";
import { useSentry } from "../../lib";
import {
  sentryCommonMock,
  sentryMock,
  sentryJSMock,
  sentryJSEventMock,
  sentryLaravelMock,
  sentryPythonMock,
  sentryPythonLogMock,
  sentrySpiralMock,
} from '../../mocks';
import type {Sentry} from "../../types";
import SentryPage from './sentry-page.vue';

const { normalizeSentryEvent } = useSentry();

export default {
  title: "Entities/Sentry/SentryPage",
  component: SentryPage,
  parameters: {
    layout: 'fullscreen',
  }
} as Meta<typeof SentryPage>;

export const PageCommon: StoryObj<typeof SentryPage> = {
  args: {
    event: normalizeSentryEvent(sentryCommonMock),
  }
};

export const PageEvent: StoryObj<typeof SentryPage> = {
  args: {
    event: normalizeSentryEvent(sentryMock),
  }
};

export const PageLaravel: StoryObj<typeof SentryPage> = {
  args: {
    event: normalizeSentryEvent(sentryLaravelMock),
  }
};

export const PageSpiral: StoryObj<typeof SentryPage> = {
  args: {
    event: normalizeSentryEvent(sentrySpiralMock),
  }
};

export const PageJS: StoryObj<typeof SentryPage> = {
  args: {
    event: normalizeSentryEvent(sentryJSMock),
  }
};

export const PageJSMessage: StoryObj<typeof SentryPage> = {
  args: {
    event: normalizeSentryEvent(sentryJSEventMock),
  }
};

export const PagePython: StoryObj<typeof SentryPage> = {
  args: {
    event: normalizeSentryEvent(sentryPythonMock as unknown as ServerEvent<Sentry>), // TODO: fix ServerEvent<Sentry>
  }
};

export const PagePythonLog: StoryObj<typeof SentryPage> = {
  args: {
    event: normalizeSentryEvent(sentryPythonLogMock as unknown as ServerEvent<Sentry>), // TODO: fix ServerEvent<Sentry>
  }
};

// A minimal Sentry SDK v4 payload: an error event with contexts.trace.trace_id
// but no transaction was captured, and no runtime/os/sdk/logger metadata.
// Before the fixes this rendered:
//   - "View full trace →" link that 404'd
//   - empty Runtime / OS / SDK context boxes
//   - timestamp in year 1970 (moment treated seconds as ms)
export const PageMinimalErrorNoTrace: StoryObj<typeof SentryPage> = {
  args: {
    event: normalizeSentryEvent({
      uuid: 'mini-1',
      type: 'sentry',
      project: null,
      timestamp: 1774960590,
      payload: {
        event_id: 'mini-1',
        timestamp: 1774960590.323397,
        platform: 'php',
        level: 'error',
        environment: 'staging',
        transaction: 'POST /api/orders',
        contexts: {
          trace: {
            trace_id: 'aabbccdd11223344eeff00112233',
            span_id: 'spanid01',
          },
        },
        exception: {
          values: [
            {
              type: 'RuntimeException',
              value: 'Order processing failed',
              stacktrace: {
                frames: [
                  {
                    filename: 'app/Orders/Processor.php',
                    function: 'process',
                    lineno: 42,
                    in_app: true,
                    context_line: '    $this->charge($order);',
                    pre_context: ['public function process(Order $order)', '{'],
                    post_context: ['    $order->markPaid();', '}'],
                  },
                ],
              },
            },
          ],
        },
      },
    } as unknown as ServerEvent<Sentry>),
  }
};
