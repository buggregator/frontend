<script lang="ts">
import { defineComponent, PropType, h } from "vue";
import {
  Monolog,
  Sentry,
  ServerEvent,
  VarDump,
  SMTP,
  Profiler,
  Inspector,
  RayDump,
  HttpDump,
} from "~/config/types";
import { EVENT_TYPES } from "~/config/constants";
import {
  normalizeMonologEvent,
  normalizeSMTPEvent,
  normalizeVarDumpEvent,
  normalizeSentryEvent,
  normalizeInspectorEvent,
  normalizeProfilerEvent,
  normalizeHttpDumpEvent,
  normalizeFallbackEvent,
  normalizeRayDumpEvent,
} from "~/utils/normalize-event";
import MonologPreview from "~/components/MonologPreview/MonologPreview.vue";
import SentryPreview from "~/components/SentryPreview/SentryPreview.vue";
import VarDumpPreview from "~/components/VarDumpPreview/VarDumpPreview.vue";
import SmtpPreview from "~/components/SmtpPreview/SmtpPreview.vue";
import RayDumpPreview from "~/components/RayDumpPreview/RayDumpPreview.vue";
import ProfilerPreview from "~/components/ProfilerPreview/ProfilerPreview.vue";
import InspectorPreview from "~/components/InspectorPreview/InspectorPreview.vue";
import PreviewFallback from "~/components/PreviewFallback/PreviewFallback.vue";
import HttpDumpPreview from "~/components/HttpDumpPreview/HttpDumpPreview.vue";

export default defineComponent({
  props: {
    event: {
      type: Object as PropType<
        ServerEvent<
          Monolog | SMTP | Sentry | VarDump | Profiler | Inspector | HttpDump  | RayDump | unknown
        >
      >,
      required: true,
    },
  },
  render() {
    const EVENT_TYPE_RENDER_MAP = {
      [EVENT_TYPES.SENTRY]: (event: ServerEvent<Sentry>) =>
        h(SentryPreview, { event: normalizeSentryEvent(event) }),
      [EVENT_TYPES.MONOLOG]: (event: ServerEvent<Monolog>) =>
        h(MonologPreview, { event: normalizeMonologEvent(event) }),
      [EVENT_TYPES.VAR_DUMP]: (event: ServerEvent<VarDump>) =>
        h(VarDumpPreview, { event: normalizeVarDumpEvent(event) }),
      [EVENT_TYPES.RAY_DUMP]: (event: ServerEvent<RayDump>) =>
        h(RayDumpPreview, { event: normalizeRayDumpEvent(event) }),
      [EVENT_TYPES.SMTP]: (event: ServerEvent<SMTP>) =>
        h(SmtpPreview, { event: normalizeSMTPEvent(event) }),
      [EVENT_TYPES.PROFILER]: (event: ServerEvent<Profiler>) =>
        h(ProfilerPreview, { event: normalizeProfilerEvent(event) }),
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
