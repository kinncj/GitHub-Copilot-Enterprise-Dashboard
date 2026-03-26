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

/**
 * Captures an HTML element as a PNG and triggers a download.
 * Uses html2canvas under the hood.
 * @param {HTMLElement} element
 * @param {string} filename
 * @returns {Promise<void>}
 */
export async function captureElementAsPng(element, filename) {
  if (!element) return;
  const html2canvas = (await import('html2canvas')).default;
  const canvas = await html2canvas(element, {
    backgroundColor: '#111111',
    scale: 2,
    logging: false,
    useCORS: true
  });
  triggerDownloadFromDataUrl(canvas.toDataURL('image/png'), filename);
}
