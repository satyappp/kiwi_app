/** Fail fast when Postgres view inference marks a required joined value nullable. */
export function requireDbValue<T>(
  value: T | null | undefined,
  field: string,
): T {
  if (value === null || value === undefined) {
    throw new Error(`Database view returned null for required field: ${field}`);
  }
  return value;
}
