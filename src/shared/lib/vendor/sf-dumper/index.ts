
import { SfdumpWrap } from './dumper.js'

const dump = SfdumpWrap(window.document)

export const callSfDump = (dumpId: string) => dump(dumpId)
