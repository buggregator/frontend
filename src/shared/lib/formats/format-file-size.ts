
export const formatFileSize = (inputBytes: number) => {
  let bytes = inputBytes;
  const thresh = 1024;

  if (Math.abs(bytes) < thresh) {
    return `${bytes} B`;
  }

  const units = ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
  let u = -1;
  const r = 10 ** 1;

  do {
    bytes /= thresh;
    u += 1;
  } while (
    Math.round(Math.abs(bytes) * r) / r >= thresh &&
    u < units.length - 1
  );

  return `${bytes.toFixed(1)} ${units[u]}`;
};
