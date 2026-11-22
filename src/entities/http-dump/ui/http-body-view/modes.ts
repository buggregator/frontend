import type { SegmentedOption } from '@/shared/ui'

// How a body is shown: JSON as raw text, pretty or a tree; HTML as a
// preview or its source. The panels switch it with a SegmentedControl.
export type ViewMode = 'raw' | 'pretty' | 'tree'
export type HtmlMode = 'preview' | 'source'

export const JSON_MODES: SegmentedOption<ViewMode>[] = [
  { value: 'raw', label: 'Raw' },
  { value: 'pretty', label: 'Pretty' },
  { value: 'tree', label: 'Tree' }
]

export const HTML_MODES: SegmentedOption<HtmlMode>[] = [
  { value: 'preview', label: 'Preview' },
  { value: 'source', label: 'Source' }
]
