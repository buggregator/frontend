export type FormatDurationOptions = {
  // What the number counts: microseconds (the profiler, the default) or
  // milliseconds (cron runs).
  unit?: 'us' | 'ms'
  // 'list': every part, «1 m, 5 s, 300 ms». 'compact': at most two parts,
  // rounded for reading, «340 ms», «8.4 s», «4 min 12 s», «2 h 5 min».
  style?: 'list' | 'compact'
}

const listStyle = (ms: number) => {
  const time = {
    d: Math.floor(ms / 86_400_000),
    h: Math.floor(ms / 3_600_000) % 24,
    m: Math.floor(ms / 60_000) % 60,
    s: Math.floor(ms / 1_000) % 60,
    ms: ms % 1_000,
  };

  return Object.entries(time)
    .filter(([_, val]) => val !== 0)
    .map(
      ([key, val]) =>
        `${
          key === "ms" && Number(val.toFixed(4)) % 1 !== 0
            ? val.toFixed(4)
            : val.toFixed(0)
        } ${key}`
    )
    .join(", ");
};

const compactStyle = (ms: number) => {
  if (ms < 1_000) return `${Math.round(ms)} ms`;
  const s = ms / 1_000;
  if (s < 60) return `${s < 10 ? s.toFixed(1) : Math.round(s)} s`;
  const total = Math.round(s);
  const m = Math.floor(total / 60);
  const sec = total % 60;
  if (m < 60) return sec ? `${m} min ${sec} s` : `${m} min`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm ? `${h} h ${mm} min` : `${h} h`;
};

export const formatDuration = (
  input: number,
  { unit = "us", style = "list" }: FormatDurationOptions = {}
) => {
  const abs = Math.abs(input);
  const ms = unit === "us" ? abs / 1_000 : abs;
  return style === "compact" ? compactStyle(ms) : listStyle(ms);
};
