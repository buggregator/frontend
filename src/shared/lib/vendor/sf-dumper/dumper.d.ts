// The returned render function gives back dispose(): call it when the dump leaves the page.
export declare function SfdumpWrap (doc: Window['document']): (id: string) => () => void
