// No allow-scripts, allow-same-origin, allow-forms or allow-top-navigation:
// only links may open, in a new tab that is not sandboxed itself.
export const EMAIL_FRAME_SANDBOX = 'allow-popups allow-popups-to-escape-sandbox'

// Comes before the captured HTML so that links without a target open in a new
// tab (the first <base target> wins) instead of navigating inside the frame.
export const EMAIL_FRAME_HEAD =
  '<base target="_blank"><style>html,body{height:100%;margin:0}</style>'
