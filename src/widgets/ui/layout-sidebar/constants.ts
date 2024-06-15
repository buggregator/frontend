import {EVENT_TYPES} from "~/src/shared/types";

export const SIDEBAR_EVENTS_ORDER = [
  EVENT_TYPES.SENTRY,
  EVENT_TYPES.PROFILER,
  EVENT_TYPES.SMTP,
  EVENT_TYPES.HTTP_DUMP,
  EVENT_TYPES.INSPECTOR,
  EVENT_TYPES.VAR_DUMP,
  EVENT_TYPES.MONOLOG,
  EVENT_TYPES.RAY_DUMP,
]


export const SIDEBAR_EVENTS_CONFIG_MAP = {
  [EVENT_TYPES.SENTRY]: {
    url: "/sentry",
    title: "Sentry",
    icon: "sentry",
  },
  [EVENT_TYPES.PROFILER]: {
    url: "/profiler",
    title: "Profiler",
    icon: "profiler",
  },
  [EVENT_TYPES.SMTP]: {
    url: "/smtp",
    title: "SMTP",
    icon: "smtp",
  },
  [EVENT_TYPES.HTTP_DUMP]: {
    url: "/http-dump",
    title: "Http dump",
    icon: "http-dump",
  },
  [EVENT_TYPES.INSPECTOR]: {
    url: "/inspector",
    title: "Inspector",
    icon: "inspector",
  },
  [EVENT_TYPES.VAR_DUMP]: {
    url: "/var-dump",
    title: "Var dump",
    icon: "var-dump",
  },
  [EVENT_TYPES.MONOLOG]: {
    url: "/monolog",
    title: "Monolog",
    icon: "monolog",
  },
  [EVENT_TYPES.RAY_DUMP]: {
    url: "/ray",
    title: "Ray",
    icon: "ray",
  }
}
