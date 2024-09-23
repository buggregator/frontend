import { SfdumpWrap } from './dumper';

const dump = SfdumpWrap(window.document);

export const callSfDump = (dumpId: string) => dump(dumpId);
