import { formatDuration } from "./format-duration";
import { formatFileSize } from "./format-file-size";

export const useFormats = () =>
  ({
    formatDuration,
    formatFileSize,
  });
