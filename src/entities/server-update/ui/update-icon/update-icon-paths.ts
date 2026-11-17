export type UpdateIconName =
  | 'check'
  | 'x'
  | 'alert'
  | 'info'
  | 'up'
  | 'copy'
  | 'external'
  | 'refresh'
  | 'undo'
  | 'lock'
  | 'terminal'
  | 'plug'

export const UPDATE_ICON_PATHS: Record<UpdateIconName, string[]> = {
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  x: ['M6 6l12 12M18 6L6 18'],
  alert: ['M12 3.5l9.5 16.5h-19z', 'M12 10v4.5M12 17.5v.01'],
  info: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 11v5.5M12 7.5v.01'],
  up: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 16.5v-9M8 11l4-4 4 4'],
  copy: ['M10 8h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z', 'M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3'],
  external: ['M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5'],
  refresh: ['M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7'],
  undo: ['M9 14L4 9l5-5', 'M4 9h10.5a5.5 5.5 0 0 1 0 11H11'],
  lock: ['M7 11h10a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2z', 'M8 11V8a4 4 0 0 1 8 0v3'],
  terminal: ['M5 4.5h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2z', 'M7 9.5l3 2.5-3 2.5M12.5 15H17'],
  plug: ['M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4']
}
