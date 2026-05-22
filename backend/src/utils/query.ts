// Helper para extraer query params como string simple
export function qs(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

export function qn(value: unknown): number | undefined {
  const s = qs(value);
  if (s === undefined) return undefined;
  const n = Number(s);
  return isNaN(n) ? undefined : n;
}
