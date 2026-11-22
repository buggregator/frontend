
export enum LocalStorageKeys {
  Theme = "theme",
  Navbar = "navbar",
  EventCounts = "event_counts",
  CodeEditor = "code_editor",
  Token = "token",
  SidebarCollapsed = "sidebar_collapsed",
  CustomFilePathMapping = "custom_file_path_mapping",
  IsActiveCustomFilePathMapping = "is_active_custom_file_path_mapping",
  Period = "period",
  SingleKeyShortcuts = "single_key_shortcuts",
  KeyHints = "key_hints",
  SeenEvents = "seen_events",
  HiddenMenuItems = "hidden_menu_items",
  DesktopNotifications = "desktop_notifications",
  MonologInlineContext = "monolog_inline_context",
  // Whose synced settings this browser holds (user id from /api/me, #6772).
  SettingsOwner = "settings_owner",
}

export enum SessionStorageKeys {
  Project = "project",
  CachedEvents = "cached_events",
  LockedEvents = "locked_events",
}
