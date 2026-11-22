// Pictures of a card and file downloads load their libraries on the first
// use (#6841): html-to-image and downloadjs are ~15 kB the feed does not need
// until someone presses Screenshot, Copy as image or Download.

export const toPng = async (el: HTMLElement): Promise<string> => (await import('html-to-image')).toPng(el)

export const toBlob = async (el: HTMLElement): Promise<Blob | null> => (await import('html-to-image')).toBlob(el)

export const download = async (data: string | Blob, fileName: string, mimeType?: string): Promise<void> => {
  const { default: save } = await import('downloadjs')
  save(data, fileName, mimeType)
}
