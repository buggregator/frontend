// The items of a Sentry list field (`exception`, `threads`, `breadcrumbs`):
// {values: [...]} in most SDKs, a bare list in sentry-go and the protocol's
// short form. Never read `.values` of a bare list: that is
// Array.prototype.values, a function (#7098).
export const sentryList = <T>(field: unknown): T[] => {
  if (Array.isArray(field)) return field as T[]
  const values = (field as { values?: unknown } | null | undefined)?.values
  return Array.isArray(values) ? (values as T[]) : []
}
