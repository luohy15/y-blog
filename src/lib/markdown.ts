/**
 * Maps a browser pathname (as seen by react-router) to its Markdown twin path.
 * Mirrors the site's home-page special case: `/` and `/<lang>/` -> `/index.md`
 * form, everything else -> `<path>.md`.
 */
export function markdownPathFor(pathname: string): string {
  const trimmed = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  if (trimmed === '' || trimmed === '/') return '/index.md';
  return `${trimmed}.md`;
}
