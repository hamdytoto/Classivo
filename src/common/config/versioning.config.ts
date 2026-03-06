export function normalizeApiVersion(rawVersion: string | undefined): string {
  const fallbackVersion = '1';
  if (!rawVersion || rawVersion.trim().length === 0) {
    return fallbackVersion;
  }

  const normalized = rawVersion.trim().toLowerCase();
  if (normalized.startsWith('v')) {
    const versionWithoutPrefix = normalized.slice(1);
    return versionWithoutPrefix.length > 0 ? versionWithoutPrefix : fallbackVersion;
  }

  return normalized;
}
