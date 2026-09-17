import { addLanguageToPath } from './language.ts';
import type { LanguageCode } from './language.ts';
import { formatDate, type BlogPost } from './blog.ts';
import { getTranslation } from './translations.ts';

const LEGACY_TAG_SEGMENT_PREFIX = 't.';
const BASE64URL_BODY = /^[A-Za-z0-9_-]+$/;

function utf8ToBytes(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function bytesToUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(body: string): Uint8Array {
  const padded = body + '='.repeat((4 - (body.length % 4)) % 4);
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function tagToSegment(tag: string): string {
  return tag;
}

export function decodeLegacyEncodedSegment(segment: string): string | null {
  if (!segment.startsWith(LEGACY_TAG_SEGMENT_PREFIX)) return null;
  const body = segment.slice(LEGACY_TAG_SEGMENT_PREFIX.length);
  if (!body || !BASE64URL_BODY.test(body)) return null;
  try {
    const tag = bytesToUtf8(base64UrlToBytes(body));
    const expected = LEGACY_TAG_SEGMENT_PREFIX + bytesToBase64Url(utf8ToBytes(tag));
    if (expected !== segment) return null;
    return tag;
  } catch {
    return null;
  }
}

const RETIRED_AGENT_TAGS = ['y-agent', 'ai-coding'] as const;
const CANONICAL_AGENT_TAG = 'ai-agent';

function resolvedLegacyTag(segment: string): string | null {
  const decoded = decodeLegacyEncodedSegment(segment);
  const candidate = decoded ?? segment;
  if ((RETIRED_AGENT_TAGS as readonly string[]).includes(candidate)) {
    return CANONICAL_AGENT_TAG;
  }
  if (decoded != null) return decoded;
  return null;
}

export function legacyRedirectTarget(
  segment: string | undefined,
  tags: string[],
  language: LanguageCode,
): string | null {
  if (segment == null || segment === '') return null;
  const target = resolvedLegacyTag(segment);
  if (target == null) return null;
  if (!tags.includes(target)) return null;
  return getTagHref(target, language);
}

export function segmentToTag(segment: string): string | null {
  if (resolvedLegacyTag(segment) != null) return null;
  return segment;
}

export function getTagHref(tag: string, language: LanguageCode): string {
  return addLanguageToPath(`/tags/${tagToSegment(tag)}`, language);
}

export function getTagsIndexHref(language: LanguageCode): string {
  return addLanguageToPath('/tags', language);
}

export function collectTags(posts: BlogPost[]): string[] {
  const tags = new Set<string>();
  for (const post of posts) {
    for (const tag of post.tags ?? []) {
      if (tag) tags.add(tag);
    }
  }
  return [...tags].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

export function relatedCreatedLabel(createTime: string, language: LanguageCode): string {
  return `${getTranslation(language, 'common.created')} ${formatDate(createTime, language)}`;
}

export function articlesForTag(posts: BlogPost[], tag: string): BlogPost[] {
  return posts
    .filter((post) => (post.tags ?? []).includes(tag))
    .sort((a, b) => new Date(b.create_time).getTime() - new Date(a.create_time).getTime());
}

export interface RelatedArticle {
  post: BlogPost;
  current: boolean;
}

export interface RelatedGroup {
  tag: string;
  articles: RelatedArticle[];
}

export function relatedGroups(posts: BlogPost[], current: BlogPost): RelatedGroup[] {
  const currentUrl = current.url;
  const groups: RelatedGroup[] = [];

  for (const tag of current.tags ?? []) {
    if (!tag) continue;
    const articles = articlesForTag(posts, tag).map((post) => ({
      post,
      current: post.url === currentUrl,
    }));
    if (!articles.some((article) => !article.current)) continue;
    groups.push({ tag, articles });
  }

  return groups;
}

export function resolveSelectedTag(
  tags: string[],
  tagSegment: string | undefined,
): { tag: string | null; fromUrl: boolean } {
  if (tagSegment != null && tagSegment !== '') {
    return { tag: segmentToTag(tagSegment), fromUrl: true };
  }
  return { tag: tags[0] ?? null, fromUrl: false };
}
