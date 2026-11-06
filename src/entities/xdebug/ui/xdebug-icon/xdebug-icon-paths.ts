// Glyphs drawn for the Xdebug design (#4413): 24×24, filled with currentColor.
export const XDEBUG_ICON_PATHS = {
  bug: 'M14.6 3.4 16 2l-1.9 1.9A5 5 0 0 1 17 8h2v2h-2v2h3v2h-3v1a5 5 0 0 1-.4 2H19v2h-3.1A5 5 0 0 1 12 21a5 5 0 0 1-3.9-2H5v-2h2.4A5 5 0 0 1 7 15v-1H4v-2h3v-2H5V8h2a5 5 0 0 1 2.9-4.1L8 2l1.4-1.4 2.2 2.2a5 5 0 0 1 .8 0zM9 10v5a3 3 0 0 0 6 0v-5zm2 1h2v2h-2zm0 3h2v2h-2z',
  agent: 'M12 2a2 2 0 0 1 1 3.7V7h4a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h4V5.7A2 2 0 0 1 12 2zM7 9a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1zm2 3h2v2H9zm4 0h2v2h-2zm-4 4h6v1H9zM1 12h2v4H1zm20 0h2v4h-2z',
  pause: 'M6 5h4v14H6zm8 0h4v14h-4z',
  play: 'M8 5v14l11-7z',
  x: 'M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6L19 6.4 17.6 5 12 10.6z',
  check: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
  lock: 'M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 0 1 6 0v3z',
  warn: 'M12 2 1 21h22zm-1 7h2v6h-2zm0 8h2v2h-2z',
  right: 'M8.6 16.6 13.2 12 8.6 7.4 10 6l6 6-6 6z',
  down: 'M7.4 8.6 12 13.2l4.6-4.6L18 10l-6 6-6-6z',
  layers: 'M12 2 1 8l11 6 11-6zm-9.2 9.6L1 12.6 12 19l11-6.4-1.8-1-9.2 5.3z',
  plus: 'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z'
} as const

export type XdebugIconName = keyof typeof XDEBUG_ICON_PATHS
