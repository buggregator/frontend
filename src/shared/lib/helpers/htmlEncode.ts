export function htmlEncode(input: string): string {
  return input.replace(/./gm, (s: string) =>
    s.match(/[a-z0-9\s]+/i) ? s : `&#${s.charCodeAt(0)};`
  );
}
