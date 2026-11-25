// No allow-scripts, allow-same-origin, allow-forms or allow-top-navigation:
// only links may open, in a new tab that is not sandboxed itself.
export const EMAIL_FRAME_SANDBOX = 'allow-popups allow-popups-to-escape-sandbox'

// A sender's own page (html events, Ray html(), frontend#132): its scripts
// run, but still without allow-same-origin, so the frame has an opaque origin
// and cannot read the app's page, localStorage (JWT) or cookies. With login
// off the API answers any origin (CORS *), so its scripts can call it, as any
// page in the browser can.
export const PAGE_FRAME_SANDBOX = 'allow-scripts allow-popups allow-popups-to-escape-sandbox'

// Comes before the captured HTML so that links without a target open in a new
// tab (the first <base target> wins) instead of navigating inside the frame.
export const EMAIL_FRAME_HEAD =
  '<base target="_blank"><style>html,body{height:100%;margin:0}</style>'

// The message a fitted frame sends with its content height.
export const FRAME_HEIGHT_KEY = 'bgrFrameHeight'

// Runs inside a fitted frame (scripts on): reports the page's own height
// whenever it changes, so the frame grows with it and never scrolls inside.
export const FRAME_FIT_SCRIPT =
  '<script>(function(){var s=function(){parent.postMessage({' +
  FRAME_HEIGHT_KEY +
  ':Math.ceil(document.documentElement.getBoundingClientRect().height)},"*")};' +
  'if(window.ResizeObserver)new ResizeObserver(s).observe(document.documentElement);' +
  'addEventListener("load",s);s()})()</script>'

// Before the page's markup, after its doctype: a <base> in front of the
// doctype would put the sender's page in quirks mode.
export const withHead = (markup: string, head: string): string => {
  const doctype = /^\s*<!doctype[^>]*>/i.exec(markup)
  return doctype ? doctype[0] + head + markup.slice(doctype[0].length) : head + markup
}
