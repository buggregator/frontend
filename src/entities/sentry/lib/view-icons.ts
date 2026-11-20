// 16 px stroke icons of the views (#6543 mock), drawn with currentColor.
export const VIEW_ICONS = {
  list: '<path d="M2.5 4h11M2.5 8h11M2.5 12h11"/>',
  map: '<circle cx="3.5" cy="8" r="1.8"/><circle cx="12.5" cy="3.5" r="1.8"/><circle cx="12.5" cy="12.5" r="1.8"/><path d="M5.2 7.2 10.8 4.3M5.2 8.8l5.6 2.9"/>',
  timeline: '<path d="M4 3v10"/><circle cx="4" cy="4.5" r="1.3"/><circle cx="4" cy="11.5" r="1.3"/><path d="M7 4.5h7M7 11.5h7"/>',
  grouped: '<rect x="2.5" y="3" width="11" height="3" rx="1"/><rect x="2.5" y="7.5" width="11" height="3" rx="1"/><path d="M4 13h8"/>',
  waterfall: '<path d="M2.5 4h5M5 8h6M8 12h5.5"/>',
  flame: '<path d="M2 13h12M3 10h8M4 7h5M5 4h2"/>',
  graph: '<circle cx="8" cy="3.5" r="1.6"/><circle cx="4" cy="12.5" r="1.6"/><circle cx="12" cy="12.5" r="1.6"/><path d="M7.2 5 4.8 11M8.8 5l2.4 6"/>',
  sequence: '<path d="M4 2.5v11M12 2.5v11M4 6h7M9.5 4.5 11 6 9.5 7.5M12 10H5M6.5 8.5 5 10l1.5 1.5"/>'
} as const

export type ViewIcon = keyof typeof VIEW_ICONS
