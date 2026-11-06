import DOMPurify, { type DOMPurify as Purifier } from 'dompurify'

// sf-dump indents expanded nodes with the spaces in `data-indent-pad`;
// DOMPurify trims attribute values, so that one keeps its raw value.
const RAW_ATTRIBUTES = new Set(['data-indent-pad'])

let purifier: Purifier | null = null

// Own instance, so the hook does not leak into other DOMPurify users.
const getPurifier = (): Purifier => {
  if (!purifier) {
    purifier = DOMPurify(window)
    purifier.addHook('uponSanitizeAttribute', (node, data) => {
      if (RAW_ATTRIBUTES.has(data.attrName)) {
        data.attrValue = node.getAttribute(data.attrName) ?? data.attrValue
      }
    })
  }
  return purifier
}

// Captured dumps (Ray, VarDumper) are untrusted HTML shown with v-html.
// DOMPurify drops scripts, event handlers and javascript: URLs and keeps the
// sf-dump markup (pre, samp, span, abbr, a, ids, classes, data-*). The dump's
// own <style> goes too: our stylesheet already styles .sf-dump.
export const sanitizeHtml = (html: string): string =>
  getPurifier().sanitize(html, { FORBID_TAGS: ['style'] })
