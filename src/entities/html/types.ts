// An event with the sender's own markup (frontend#132, buggregator/server #501).
// The event page gets {title, html, size}. The feed gets a preview instead:
// {title, size, text} plus `html` up to 32 KB, else `truncated`.
export type HtmlPayload = {
  // From the JSON "title" or the page's <title>; may be empty.
  title?: string
  html?: string
  // Bytes of the markup.
  size?: number
  // Feed preview only: the visible text, at most 300 characters.
  text?: string
  // Feed preview only: the markup is over 32 KB and left out.
  truncated?: boolean
}
