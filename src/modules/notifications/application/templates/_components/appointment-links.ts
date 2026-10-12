export function appointmentUrl(value?: string): string | undefined {
  if (!value || value.trim() !== value || !/^https?:\/\//i.test(value)) return undefined;
  try {
    const url = new URL(value);
    if (!url.hostname || url.username || url.password) return undefined;
    return value;
  } catch {
    return undefined;
  }
}

export function appointmentLink(label: string, value?: string): string {
  const url = appointmentUrl(value);
  return url ? ` ${label}: ${url}.` : '';
}
