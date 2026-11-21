import type { Component, InjectionKey } from 'vue'

// A way from a place in code (a stack frame, a span, a profiled function) into
// the code graph (#6573 A). Entities may not import each other, so the app
// provides the link component and the frame or span only renders it.
export type CodeLocationLinkProps = {
  // Absolute path as the SDK sent it, or relative to a code graph root.
  file: string
  line: number
  // Where the person comes from, e.g. the exception type.
  origin?: string
  label?: 'Graph' | 'Code'
}

export const CODE_LOCATION_LINK: InjectionKey<Component> = Symbol('code-location-link')
