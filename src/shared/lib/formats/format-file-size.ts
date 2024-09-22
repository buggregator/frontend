export const formatFileSize = (inputBytes: number, fraction = 1) => {
  let bytes: number = inputBytes;
  const thresh = 1024;

  if (Math.abs(bytes) < thresh) {
    return `${bytes} B`;
  }

  const units = ["Kb", "Mb", "Gb", "Tb", "b", "Eb", "Zb", "Yb"];
  let u = -1;
  const r: number = 10 ** 1;

  do {
    bytes /= thresh;
    u += 1;
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

  return `${bytes.toFixed(fraction)} ${units[u]}`;
};
