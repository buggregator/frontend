import sentryCommonMock from './sentry-common.json';
import sentryMock from './sentry-event.json';
// sentry-go CaptureMessage: exception, threads and breadcrumbs as bare lists (#7098).
import sentryGoMessageMock from './sentry-go-message.json';
import sentryJSEventMock from './sentry-js-event.json';
import sentryJSMock from './sentry-js.json';
import sentryLaravelMock from './sentry-laravel.json';
import sentryPythonLogMock from './sentry-python-log.json';
import sentryPythonMock from './sentry-python.json';
import sentrySpiralMock from './sentry-spiral.json';

export {
  sentryCommonMock,
  sentryGoMessageMock,
  sentryMock,
  sentryJSMock,
  sentryJSEventMock,
  sentryLaravelMock,
  sentryPythonMock,
  sentryPythonLogMock,
  sentrySpiralMock,
}

export {
  mockCounts,
  mockExceptionGroups,
  mockExceptionItems,
  mockPreviewSpans,
  mockTraces,
  mockSpans,
  mockTraceDetail,
  mockLogs,
  mockMetrics,
  mockServiceMap,
} from './sentry-v2-mocks'
