import { addLanguageToPath } from './language.ts';
import type { LanguageCode } from './language.ts';
import type { BlogPost } from './blog.ts';

const TAG_SEGMENT_PREFIX = 't.';

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

const BASE64URL_BODY = /^[A-Za-z0-9_-]+$/;

function base64UrlToBytes(body: string): Uint8Array {
  const padded = body + '='.repeat((4 - (body.length % 4)) % 4);
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function tagToSegment(tag: string): string {
  return TAG_SEGMENT_PREFIX + bytesToBase64Url(utf8ToBytes(tag));
}

export function segmentToTag(segment: string): string | null {
  if (!segment.startsWith(TAG_SEGMENT_PREFIX)) return null;
  const body = segment.slice(TAG_SEGMENT_PREFIX.length);
  if (!body || !BASE64URL_BODY.test(body)) return null;
  try {
    const tag = bytesToUtf8(base64UrlToBytes(body));
    if (tagToSegment(tag) !== segment) return null;
    return tag;
  } catch {
    return null;
  }
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
