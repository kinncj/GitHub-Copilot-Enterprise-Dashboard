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

/**
 * Captures the entire page as a PNG, including all table rows (overflow expanded).
 * @param {string} filename
 * @returns {Promise<void>}
 */
export async function captureFullPageAsPng(filename) {
  const html2canvas = (await import('html2canvas')).default;

  // Expand clipped scroll containers so all rows are visible in the capture
  const clipped = document.querySelectorAll('.table-container');
  const saved = Array.from(clipped).map(el => ({
    el,
    maxHeight: el.style.maxHeight,
    overflow:  el.style.overflow,
  }));
  for (const { el } of saved) {
    el.style.maxHeight = 'none';
    el.style.overflow  = 'visible';
  }

  try {
    const canvas = await html2canvas(document.documentElement, {
      backgroundColor: '#111111',
      scale: 1,
      logging: false,
      useCORS: true,
      scrollX: 0,
      scrollY: 0,
    });
    triggerDownloadFromDataUrl(canvas.toDataURL('image/png'), filename);
  } finally {
    for (const { el, maxHeight, overflow } of saved) {
      el.style.maxHeight = maxHeight;
      el.style.overflow  = overflow;
    }
  }
}
