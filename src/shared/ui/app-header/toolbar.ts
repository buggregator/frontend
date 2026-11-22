import { inject, provide, type InjectionKey } from 'vue'

// Row 2 of the page header has this id: a page part rendered below the
// header (an event's tabs, the views of a trace) moves its controls there.
export const APP_HEADER_TOOLBAR_ID = 'app-header-toolbar'

const HEADER_TOOLBAR: InjectionKey<boolean> = Symbol('header-toolbar')

// Called by the page that gives its AppHeader a #toolbar: the parts below may
// put their controls into it. Without it they stay where they are.
export const provideHeaderToolbar = () => provide(HEADER_TOOLBAR, true)

export const hasHeaderToolbar = () => inject(HEADER_TOOLBAR, false)
