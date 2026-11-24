/** Hands the viewer a file to save. */
export function downloadText(fileName: string, text: string, type = 'application/json'): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** The device's IANA time zone, e.g. "America/Toronto". */
export const deviceTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Toronto';
