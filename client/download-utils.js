export function downloadBrowserBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
}
