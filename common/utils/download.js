/**
 * Triggers a browser file download from a Blob.
 * @param {Blob} blob
 * @param {string} filename
 */
export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Triggers a browser file download from a data URL.
 * @param {string} dataUrl
 * @param {string} filename
 */
export function triggerDownloadFromDataUrl(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
