import { getSlugFromUrl, getDateSegments, getPostHref, type BlogPost } from './blog.ts';
import { addLanguageToPath, defaultLanguage, languages, type LanguageCode } from './language.ts';
import { articlesForTag, getTagHref, legacyAliasSegmentsFor, tagToSegment } from './tags.ts';
import { getTranslation } from './translations.ts';

const SITE_HOST_PATTERN = /^https?:\/\/(?:www\.)?luohy15\.com(\/.*)?$/i;

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

/**
 * Guards the build-time generator against publishing an empty site: the
 * default-language index is the one every other language's home/writing/tags
 * twin structurally depends on, so an empty result for it (a CDN response
 * that parsed but yielded zero posts) is treated as a fatal index failure,
 * not "no posts yet".
 */
export function assertNonEmptyIndex(posts: BlogPost[], language: LanguageCode): void {
  if (language === defaultLanguage && posts.length === 0) {
    throw new Error(`Refusing to generate Markdown twins: the ${language} post index returned zero posts.`);
  }
}

function aliasSlugsFor(canonicalSlug: string, redirects: Record<string, string>): string[] {
  return Object.entries(redirects)
    .filter(([, target]) => target === canonicalSlug)
    .map(([oldSlug]) => oldSlug);
}

/**
 * Every HTML route path (no `.md` suffix) that should serve this post's
 * Markdown twin: canonical slug, dated slug (when the create date parses),
 * each prefixed with the language segment for non-default languages, plus
 * the same shapes for any redirect alias slug that points at this post.
 */
export function articleTwinPaths(
  post: BlogPost,
  lang: LanguageCode,
  redirects: Record<string, string>,
): string[] {
  const canonicalSlug = getSlugFromUrl(post.url);
  const slugs = [canonicalSlug, ...aliasSlugsFor(canonicalSlug, redirects)];
  const segs = getDateSegments(post.create_time);
  const langPrefix = lang !== defaultLanguage ? `/${lang}` : '';

  const paths: string[] = [];
  for (const slug of slugs) {
    paths.push(`${langPrefix}/${slug}`);
    if (segs) {
      paths.push(`${langPrefix}/${segs.yyyy}/${segs.mm}/${segs.dd}/${slug}`);
    }
  }
  return paths;
}

// Fenced code blocks: ``` or ~~~, 3 or more of the same character, closed by
// a line of the same fence character (CommonMark allows a longer closing
// fence, but requires at least as many characters; `{3,}` plus the
// backreference covers the common case without over-matching a shorter one).
const BLOCK_FENCE_REGEX = /^(`{3,}|~{3,}).*$[\s\S]*?^\1[ \t]*$/gm;
// Inline code spans: a run of one or more backticks, content, then a run of
// the same length. Markdown link syntax written as a literal example inside
// one of these (e.g. `` `[text](url)` `` in prose) must not be rewritten.
const INLINE_CODE_REGEX = /(`+)[\s\S]*?\1/g;

function splitByRegex(text: string, regex: RegExp): { text: string; fenced: boolean }[] {
  const parts: { text: string; fenced: boolean }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  regex.lastIndex = 0;

  while ((match = regex.exec(text))) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), fenced: false });
    }
    parts.push({ text: match[0], fenced: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), fenced: false });
  }
  return parts;
}

/**
 * Splits markdown into segments that are safe to rewrite links in (fenced:
 * false) and segments that must be left untouched (fenced: true): fenced
 * code blocks (``` or ~~~) and inline code spans.
 */
function splitFencedCode(markdown: string): { text: string; fenced: boolean }[] {
  const blocks = splitByRegex(markdown, BLOCK_FENCE_REGEX);
  const result: { text: string; fenced: boolean }[] = [];
  for (const block of blocks) {
    if (block.fenced) {
      result.push(block);
    } else {
      result.push(...splitByRegex(block.text, INLINE_CODE_REGEX));
    }
  }
  return result;
}

function matchSiteArticleLink(target: string, posts: BlogPost[], language: LanguageCode): string | null {
  let isAbsolute = false;
  let pathPart: string;

  const absoluteMatch = SITE_HOST_PATTERN.exec(target);
  if (absoluteMatch) {
    isAbsolute = true;
    pathPart = absoluteMatch[1] ?? '/';
  } else if (target.startsWith('/')) {
    pathPart = target;
  } else {
    return null;
  }

  const splitIndex = pathPart.search(/[?#]/);
  const suffix = splitIndex === -1 ? '' : pathPart.slice(splitIndex);
  const cleanPath = splitIndex === -1 ? pathPart : pathPart.slice(0, splitIndex);
  const segments = cleanPath.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  if (!lastSegment) return null;

  const match = posts.find((post) => getSlugFromUrl(post.url) === lastSegment);
  if (!match) return null;

  const href = getPostHref(match, language) + '.md';
  return (isAbsolute ? 'https://luohy15.com' : '') + href + suffix;
}

function rewriteTarget(target: string, posts: BlogPost[], language: LanguageCode, cdnDir: string): string {
  if (target.startsWith('#') || target.startsWith('mailto:')) return target;

  const siteMatch = matchSiteArticleLink(target, posts, language);
  if (siteMatch) return siteMatch;

  if (/^https?:\/\//i.test(target) || target.startsWith('/')) return target;

  try {
    return new URL(target, cdnDir).toString();
  } catch {
    return target;
  }
}

function rewriteLinkDestination(inner: string, posts: BlogPost[], language: LanguageCode, cdnDir: string): string {
  // `inner` is everything between the link's `(` and `)`: the destination,
  // optionally followed by whitespace and a "title". Only the destination
  // (up to the first whitespace) is a rewrite target.
  const spaceIndex = inner.search(/\s/);
  const target = spaceIndex === -1 ? inner : inner.slice(0, spaceIndex);
  const rest = spaceIndex === -1 ? '' : inner.slice(spaceIndex);
  return rewriteTarget(target, posts, language, cdnDir) + rest;
}

/**
 * Rewrites `[text](dest)` / `![alt](dest)` link destinations in a plain-text
 * (non-fenced, non-inline-code) segment, matching `(...)` with one level of
 * balanced nested parentheses so destinations like a Wikipedia URL
 * (`.../wiki/Foo_(bar)`) are captured in full instead of cut at the first `)`.
 */
function rewriteLinksInText(text: string, posts: BlogPost[], language: LanguageCode, cdnDir: string): string {
  let result = '';
  let i = 0;

  while (i < text.length) {
    const bracketStart = text.indexOf('[', i);
    if (bracketStart === -1) {
      result += text.slice(i);
      break;
    }
    result += text.slice(i, bracketStart);

    let depth = 1;
    let j = bracketStart + 1;
    while (j < text.length && depth > 0) {
      if (text[j] === '[') depth++;
      else if (text[j] === ']') depth--;
      j++;
    }
    if (depth !== 0 || text[j] !== '(') {
      // Unmatched bracket, or a `[...]` that isn't followed by a link
      // destination (e.g. a reference-style link) — leave it untouched and
      // resume scanning right after this `[`.
      result += text.slice(bracketStart, bracketStart + 1);
      i = bracketStart + 1;
      continue;
    }

    let parenDepth = 1;
    let k = j + 1;
    while (k < text.length && parenDepth > 0) {
      if (text[k] === '(') parenDepth++;
      else if (text[k] === ')') parenDepth--;
      if (parenDepth > 0) k++;
    }
    if (parenDepth !== 0) {
      // Unterminated destination; leave the rest of the text untouched.
      result += text.slice(bracketStart);
      break;
    }

    const inner = text.slice(j + 1, k);
    result += text.slice(bracketStart, j + 1) + rewriteLinkDestination(inner, posts, language, cdnDir) + ')';
    i = k + 1;
  }

  return result;
}

export interface RewriteLinksContext {
  posts: BlogPost[];
  language: LanguageCode;
  sourceUrl: string;
}

/**
 * Rewrites relative link/image targets to absolute CDN URLs, and same-site
 * article links (by matching the URL's last path segment against this
 * language's post slugs) to their Markdown twin. Fenced code blocks (```` ``` ````
 * and `~~~`) and inline code spans are left untouched, and destinations with
 * one level of balanced nested parentheses are matched in full.
 */
export function rewriteLinks(markdown: string, ctx: RewriteLinksContext): string {
  const cdnDir = ctx.sourceUrl.slice(0, ctx.sourceUrl.lastIndexOf('/') + 1);
  return splitFencedCode(markdown)
    .map((segment) =>
      segment.fenced ? segment.text : rewriteLinksInText(segment.text, ctx.posts, ctx.language, cdnDir),
    )
    .join('');
}

function yamlString(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/**
 * Renders an article's Markdown twin: generated YAML front matter (title,
 * created, updated, tags, canonical HTML url) followed by the source body
 * (its own front matter already stripped by the caller).
 */
export function renderArticle(post: BlogPost, content: string, canonicalUrl: string): string {
  const header = [
    '---',
    `title: ${yamlString(post.title)}`,
    `created: ${post.create_time}`,
    `updated: ${post.update_time}`,
    `tags: [${(post.tags ?? []).join(', ')}]`,
    `url: ${canonicalUrl}`,
    '---',
  ].join('\n');

  const body = content.replace(/^\n+/, '');
  return `${header}\n\n${body}${body.endsWith('\n') ? '' : '\n'}`;
}

export function renderWriting(posts: BlogPost[], language: LanguageCode): string {
  const lines = [`# ${getTranslation(language, 'nav.writing')}`, ''];
  if (posts.length === 0) {
    lines.push(getTranslation(language, 'common.noPosts'));
  } else {
    for (const post of posts) {
      lines.push(`- [${post.title}](${getPostHref(post, language)}.md) (${post.create_time})`);
    }
  }
  return lines.join('\n') + '\n';
}

export function renderTags(tags: string[], posts: BlogPost[], language: LanguageCode): string {
  const lines = [`# ${getTranslation(language, 'tags.title')}`, ''];
  if (tags.length === 0) {
    lines.push(getTranslation(language, 'tags.empty'));
  } else {
    for (const tag of tags) {
      const count = articlesForTag(posts, tag).length;
      lines.push(`- [${tag}](${getTagHref(tag, language)}.md) (${count})`);
    }
  }
  return lines.join('\n') + '\n';
}

export function renderTagListing(tag: string, posts: BlogPost[], language: LanguageCode): string {
  const lines = [`# ${tag}`, ''];
  if (posts.length === 0) {
    lines.push(getTranslation(language, 'tags.emptyTag'));
  } else {
    for (const post of posts) {
      lines.push(`- [${post.title}](${getPostHref(post, language)}.md) (${post.create_time})`);
    }
  }
  return lines.join('\n') + '\n';
}

/**
 * Every `/tags/<segment>` route path (no `.md`, no language prefix applied
 * here beyond `language`) that should serve this tag's listing: the
 * canonical tag segment, its legacy base64url segment, and (for the
 * canonical agent tag) the retired plain-text aliases.
 */
export function tagTwinPaths(tag: string, language: LanguageCode): string[] {
  const segments = [tagToSegment(tag), ...legacyAliasSegmentsFor(tag)];
  return segments.map((segment) => addLanguageToPath(`/tags/${segment}`, language));
}

export function renderLlmsTxt(enPosts: BlogPost[]): string {
  const lines: string[] = [
    '# Huayi Luo',
    '',
    'Personal blog of Huayi Luo (luohy15): software engineering, AI agents, and travel writing.',
    '',
    "Append `.md` to any page URL on this site to get that page as plain Markdown; the home page's Markdown is at `/index.md`.",
    '',
  ];

  const otherLanguages = Object.values(languages).filter((language) => language.code !== defaultLanguage);
  if (otherLanguages.length > 0) {
    const links = otherLanguages.map((language) => `[${language.name}](/${language.code}/writing.md)`);
    lines.push(`Other languages: ${links.join(', ')}.`, '');
  }

  lines.push(
    '## Pages',
    '- [Home](/index.md)',
    '- [Writing](/writing.md)',
    '- [Tags](/tags.md)',
    '',
    '## Articles',
  );
  for (const post of enPosts) {
    lines.push(`- [${post.title}](${getPostHref(post, 'en')}.md) (${post.create_time})`);
  }
  return lines.join('\n') + '\n';
}

export function renderNotFound(): string {
  return 'Not found.\n\nSee /llms.txt for the site index.\n';
}
