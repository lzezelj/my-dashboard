const LEGACY_FRONTEND_HOSTNAME = 'my-dashboard.lovro-zezelj.workers.dev';

type LocationParts = Pick<Location, 'hostname' | 'pathname' | 'search' | 'hash'>;

export function getCanonicalRedirect(
  location: LocationParts,
  canonicalOrigin: string,
): string | null {
  if (location.hostname.toLowerCase() !== LEGACY_FRONTEND_HOSTNAME) return null;
  if (!canonicalOrigin) return null;

  let destination: URL;
  try {
    destination = new URL(canonicalOrigin);
  } catch {
    return null;
  }

  if (destination.protocol !== 'https:' || destination.hostname === LEGACY_FRONTEND_HOSTNAME) {
    return null;
  }

  destination.pathname = location.pathname;
  destination.search = location.search;
  destination.hash = location.hash;
  return destination.toString();
}
