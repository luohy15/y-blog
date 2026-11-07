// Hosts that serve this site. Absolute links to them are internal navigation and
// stay in the current tab; every other http(s) host opens in a new tab.
const SITE_HOSTS = new Set(['luohy15.com', 'www.luohy15.com']);

/**
 * Whether a content link should open in a new tab.
 *
 * Relative paths, fragments, query-only links and non-http schemes (mailto:,
 * tel:) return false, which keeps their previous same-tab behavior.
 */
export function opensInNewTab(href: string | undefined): boolean {
  if (!href) return false;

  if (href.startsWith('//')) {
    try {
      return !SITE_HOSTS.has(new URL(`https:${href}`).hostname.toLowerCase());
    } catch {
      return false;
    }
  }

  if (!/^https?:/i.test(href)) return false;

  try {
    return !SITE_HOSTS.has(new URL(href).hostname.toLowerCase());
  } catch {
    return true;
  }
}
