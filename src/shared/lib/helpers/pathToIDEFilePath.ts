import {IDE_KEYS, IDE_TITLES_TO_KEYS_MAP} from "../../constants";


function toFileUrl(posixAbsPath: string): string {
  // Input example is POSIX (/app/...), so keep it simple.
  return `file://${posixAbsPath.startsWith("/") ? "" : "/"}${posixAbsPath}`;
}

/**
 * Build a deep link for the given IDE for a POSIX absolute path + optional line.
 * Returns null for IDEs without a reliable scheme (e.g., Xcode).
 */
export function pathToIDEFilePath(ide: IDE_KEYS, source: string, line?: number): string | null {
  if (!source) throw new Error("source is required");

  const ln = typeof line === "number" && Number.isFinite(line) && line > 0 ? line : null;

  if (ide === IDE_KEYS.VSCODE) {
    return `${IDE_KEYS.VSCODE}://file${source}${ln ? `:${ln}:1` : ""}`;
  }

  if (ide === IDE_KEYS.CURSOR) {
    return `${IDE_KEYS.CURSOR}://file${source}${ln ? `:${ln}` : ""}`;
  }

  if (IDE_TITLES_TO_KEYS_MAP[ide].startsWith("JetBrains ")) {
    const params = new URLSearchParams({ source });
    if (ln) params.set("line", String(ln));
    return `jetbrains://${ide}/navigate/reference?${params.toString()}`;
  }

  if (ide === IDE_KEYS.SUBLIME_TEXT) {
    const params = new URLSearchParams({ url: toFileUrl(source) });
    if (ln) params.set("line", String(ln));
    return `${IDE_KEYS.SUBLIME_TEXT}://open?${params.toString()}`;
  }

  if (ide === IDE_KEYS.ATOM) {
    const params = new URLSearchParams({ filename: source });
    if (ln) params.set("line", String(ln));
    return `${IDE_KEYS.ATOM}://core/open/file?${params.toString()}`;
  }


  if (ide === IDE_KEYS.TEXTMATE) {
    const params = new URLSearchParams({ url: toFileUrl(source) });
    if (ln) params.set("line", String(ln));
    return `${IDE_KEYS.TEXTMATE}://open?${params.toString()}`;
  }

  if (ide === IDE_KEYS.NOVA) {
    const params = new URLSearchParams({ path: source });
    if (ln) params.set("line", String(ln));
    return `${IDE_KEYS.NOVA}://core/open/file?${params.toString()}`;
  }

  return null;
}
