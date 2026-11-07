// Inspector SDKs send the transaction time as Unix seconds (inspector-php: microtime(true)).
// Below this value a number is read as seconds (seconds reach it in year 5138, milliseconds in 1973).
const SECONDS_LIMIT = 1e11

export const inspectorTimestampToDate = (value: number | null | undefined): Date | null => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return null
  }

  return new Date(value < SECONDS_LIMIT ? Math.round(value * 1000) : value)
}
