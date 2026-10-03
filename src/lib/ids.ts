/** Placeholder id for a not-yet-saved item; the API assigns the real one. */
export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}`;
}
