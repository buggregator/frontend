<script lang="ts">
import { defineComponent, PropType, h } from "vue";
import {
  Monolog,
  Sentry,
  VarDump,
  SMTP,
  Profiler,
  Inspector,
  RayDump,
  HttpDump,
} from "~/config/types";
import { EVENT_TYPES, ServerEvent } from "~/src/shared/types";
import {
  normalizeInspectorEvent,
  normalizeHttpDumpEvent,
  normalizeFallbackEvent,
  normalizeRayDumpEvent,
} from "~/utils/normalize-event";
import RayDumpPreview from "~/components/RayDumpPreview/RayDumpPreview.vue";
import InspectorPreview from "~/components/InspectorPreview/InspectorPreview.vue";
import PreviewFallback from "~/components/PreviewFallback/PreviewFallback.vue";
import HttpDumpPreview from "~/components/HttpDumpPreview/HttpDumpPreview.vue";
import {
  useProfiler,
  PreviewCard as PreviewProfiler,
} from "~/src/entities/profiler";
import {
  useMonolog,
  PreviewCard as PreviewMonolog,
} from "~/src/entities/monolog";
import {
  useVarDump,
  PreviewCard as PreviewVarDump,
} from "~/src/entities/var-dump";
import { useSentry, PreviewCard as PreviewSentry } from "~/src/entities/sentry";
import { useSmtp, PreviewCard as PreviewSMTP } from "~/src/entities/smtp";

const { normalizeProfilerEvent } = useProfiler();
const { normalizeVarDumpEvent } = useVarDump();
const { normalizeMonologEvent } = useMonolog();
const { normalizeSentryEvent } = useSentry();
const { normalizeSmtpEvent } = useSmtp();

export default defineComponent({
  props: {
    event: {
      type: Object as PropType<
        ServerEvent<
          | Monolog
          | SMTP
          | Sentry
          | VarDump
          | Profiler
          | Inspector
          | HttpDump
          | RayDump
          | unknown
        >
      >,
      required: true,
    },
  },
  render() {
    const EVENT_TYPE_RENDER_MAP = {
      [EVENT_TYPES.SENTRY]: (event: ServerEvent<Sentry>) =>
        h(PreviewSentry, { event: normalizeSentryEvent(event) }),
      [EVENT_TYPES.MONOLOG]: (event: ServerEvent<Monolog>) =>
        h(PreviewMonolog, { event: normalizeMonologEvent(event) }),
      [EVENT_TYPES.VAR_DUMP]: (event: ServerEvent<VarDump>) =>
        h(PreviewVarDump, { event: normalizeVarDumpEvent(event) }),
      [EVENT_TYPES.RAY_DUMP]: (event: ServerEvent<RayDump>) =>
        h(RayDumpPreview, { event: normalizeRayDumpEvent(event) }),
      [EVENT_TYPES.SMTP]: (event: ServerEvent<SMTP>) =>
        h(PreviewSMTP, { event: normalizeSmtpEvent(event) }),
      [EVENT_TYPES.PROFILER]: (event: ServerEvent<Profiler>) =>
        h(PreviewProfiler, { event: normalizeProfilerEvent(event) }),
      [EVENT_TYPES.INSPECTOR]: (event: ServerEvent<Inspector>) =>
        h(InspectorPreview, { event: normalizeInspectorEvent(event) }),
      [EVENT_TYPES.HTTP_DUMP]: (event: ServerEvent<HttpDump>) =>
        h(HttpDumpPreview, { event: normalizeHttpDumpEvent(event) }),
    };

    if (Object.values(EVENT_TYPES).includes(this.event.type)) {
      const renderFunction = EVENT_TYPE_RENDER_MAP[this.event.type];

      if (renderFunction) {
        return renderFunction(this.event);
      }
    }

    return h(PreviewFallback, { event: normalizeFallbackEvent(this.event) });
  },
});
</script>
