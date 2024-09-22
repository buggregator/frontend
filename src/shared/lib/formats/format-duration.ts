export const formatDuration = (inputMs: number) => {
  let ms = inputMs
  if (ms < 0) {
    ms = -ms
  }

  ms /= 1_000

  const time = {
    d: Math.floor(ms / 86_400_000),
    h: Math.floor(ms / 3_600_000) % 24,
    m: Math.floor(ms / 60_000) % 60,
    s: Math.floor(ms / 1_000) % 60,
    ms: ms % 1_000
  }

  return Object.entries(time)
    .filter(([_, val]) => val !== 0)
    .map(
      ([key, val]) =>
        `${
          key === "ms" && Number(val.toFixed(4)) % 1 !== 0 ? val.toFixed(4) : val.toFixed(0)
        } ${key}`
    )
    .join(", ")
}
