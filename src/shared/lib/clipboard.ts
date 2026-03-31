/**
 * Clipboard utilities with fallback for non-secure (HTTP) contexts
 * where navigator.clipboard API is not available.
 */

export function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text)
  }

  return new Promise((resolve, reject) => {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()

    try {
      document.execCommand('copy')
      resolve()
    } catch (e) {
      reject(e)
    } finally {
      document.body.removeChild(textarea)
    }
  })
}

export function copyBlobToClipboard(blob: Blob): Promise<void> {
  if (navigator.clipboard?.write) {
    return navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
  }

  // Fallback: convert image blob to a data URL and copy as text
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      copyTextToClipboard(reader.result as string).then(resolve, reject)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}
