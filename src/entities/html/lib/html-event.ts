import { formatFileSize } from '@/shared/lib/formats/format-file-size'
import type { HtmlPayload } from '../types'

export const HTML_UNTITLED = 'HTML page'

export const htmlTitle = (payload: HtmlPayload): string => payload.title?.trim() || HTML_UNTITLED

// «12.3 KB», or '' when the server sent no size.
export const htmlSize = (payload: HtmlPayload): string =>
  typeof payload.size === 'number' && payload.size > 0 ? formatFileSize(payload.size) : ''
