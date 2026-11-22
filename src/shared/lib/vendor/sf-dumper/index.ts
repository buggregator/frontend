import { SfdumpWrap } from './dumper.js'

const dump = SfdumpWrap(window.document)

// Returns dispose(): removes what the dump left outside its own element.
export const callSfDump = (dumpId: string): (() => void) => dump(dumpId)
