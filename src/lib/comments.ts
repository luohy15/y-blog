export const COMMENTS_REPO = 'luohy15/y-blog-content';
export const COMMENT_TITLE_PREFIX = '[Comments] ';

const MARKER_RE = /<!--\s*y-blog-comment-thread:\s*([^\s>]+)\s*-->/;
const API_ROOT = `https://api.github.com/repos/${COMMENTS_REPO}`;
const REQUEST_TIMEOUT_MS = 15000;
const CACHE_PREFIX = 'y-blog:comments:v1:';
const THREAD_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const PAGE_CACHE_TTL_MS = 60 * 1000;

export function commentMarker(slug: string): string {
  return `<!-- y-blog-comment-thread: ${slug} -->`;
}

export function parseCommentMarker(body: string | null | undefined): string | null {
  if (!body) return null;
  const match = MARKER_RE.exec(body);
  return match ? match[1] : null;
}

export interface IssueLike {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  pull_request?: unknown;
}

export interface CommentThread {
  number: number;
  title: string;
  slug: string;
  htmlUrl: string;
}

export function threadFromIssue(issue: IssueLike): CommentThread | null {
  if (issue.pull_request != null) return null;
  const slug = parseCommentMarker(issue.body);
  if (!slug) return null;
  return {
    number: issue.number,
    title: issue.title,
    slug,
    htmlUrl: issue.html_url,
  };
}

export function findThread(issues: readonly IssueLike[], slug: string): CommentThread | null {
  for (const issue of issues) {
    const thread = threadFromIssue(issue);
    if (thread && thread.slug === slug) return thread;
  }
  return null;
}

export function newThreadUrl(slug: string, articleUrl: string): string {
  const params = new URLSearchParams({
    title: `${COMMENT_TITLE_PREFIX}${slug}`,
    body: `${commentMarker(slug)}\n\n${articleUrl}\n`,
  });
  return `https://github.com/${COMMENTS_REPO}/issues/new?${params.toString()}`;
}

export function repoIssuesUrl(): string {
  return `https://github.com/${COMMENTS_REPO}/issues`;
}

export interface GitHubUser {
  login: string;
  avatar_url: string;
  html_url: string;
}

export interface ThreadComment {
  id: number;
  body: string;
  htmlUrl: string;
  createdAt: string;
  user: GitHubUser | null;
}

export interface CommentPage {
  comments: ThreadComment[];
  nextUrl: string | null;
}

interface RawComment {
  id: number;
  body: string | null;
  html_url: string;
  created_at: string;
  user: GitHubUser | null;
}

function nextPageUrl(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  for (const part of linkHeader.split(',')) {
    const match = /<([^>]+)>;\s*rel="next"/.exec(part);
    if (match) return match[1];
  }
  return null;
}

interface CacheEntry<T> {
  at: number;
  value: T;
}

function sessionStore(): Storage | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    return null;
  }
}

function cacheGet<T>(key: string, ttlMs: number): T | undefined {
  const store = sessionStore();
  if (!store) return undefined;
  try {
    const raw = store.getItem(CACHE_PREFIX + key);
    if (!raw) return undefined;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (!entry || typeof entry.at !== 'number' || Date.now() - entry.at > ttlMs) {
      store.removeItem(CACHE_PREFIX + key);
      return undefined;
    }
    return entry.value;
  } catch {
    return undefined;
  }
}

function cacheSet<T>(key: string, value: T): void {
  const store = sessionStore();
  if (!store) return;
  try {
    store.setItem(CACHE_PREFIX + key, JSON.stringify({ at: Date.now(), value }));
  } catch {
    // Storage full or blocked: caching is best-effort, the fetch result still renders.
  }
}

export class RateLimitError extends Error {
  constructor(message = 'GitHub API rate limit reached') {
    super(message);
    this.name = 'RateLimitError';
  }
}

function isRateLimitResponse(response: Response): boolean {
  if (response.status !== 403 && response.status !== 429) return false;
  return (
    response.headers.get('x-ratelimit-remaining') === '0' ||
    response.headers.has('retry-after')
  );
}

function requestSignal(parent?: AbortSignal): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new DOMException('Comments request timed out', 'TimeoutError'));
  }, REQUEST_TIMEOUT_MS);
  const forwardAbort = () => controller.abort(parent?.reason);
  if (parent) {
    if (parent.aborted) {
      forwardAbort();
    } else {
      parent.addEventListener('abort', forwardAbort, { once: true });
    }
  }
  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer);
      parent?.removeEventListener('abort', forwardAbort);
    },
  };
}

async function githubGet<T>(url: string, signal?: AbortSignal): Promise<{ data: T; response: Response }> {
  const scoped = requestSignal(signal);
  try {
    const response = await fetch(url, {
      signal: scoped.signal,
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!response.ok) {
      if (isRateLimitResponse(response)) throw new RateLimitError();
      throw new Error(`GitHub API ${response.status}`);
    }
    const data = await response.json() as T;
    return { data, response };
  } finally {
    scoped.cleanup();
  }
}

export async function listThreadIssues(signal?: AbortSignal): Promise<IssueLike[]> {
  const { data } = await githubGet<IssueLike[]>(`${API_ROOT}/issues?state=all&per_page=100`, signal);
  return data;
}

export interface FetchOptions {
  bypassCache?: boolean;
}

export async function findThreadForSlug(
  slug: string,
  signal?: AbortSignal,
  options: FetchOptions = {},
): Promise<CommentThread | null> {
  const key = `thread:${slug}`;
  const cached = options.bypassCache ? undefined : cacheGet<CommentThread | null>(key, THREAD_CACHE_TTL_MS);
  if (cached !== undefined) return cached;
  const thread = findThread(await listThreadIssues(signal), slug);
  cacheSet(key, thread);
  return thread;
}

export async function listComments(
  thread: CommentThread,
  pageUrl?: string,
  signal?: AbortSignal,
  options: FetchOptions = {},
): Promise<CommentPage> {
  const url = pageUrl ?? `${API_ROOT}/issues/${thread.number}/comments?per_page=100`;
  const key = `page:${thread.slug}:${url}`;
  const cached = options.bypassCache ? undefined : cacheGet<CommentPage>(key, PAGE_CACHE_TTL_MS);
  if (cached !== undefined) return cached;
  const { data, response } = await githubGet<RawComment[]>(url, signal);
  const page: CommentPage = {
    comments: data.map((item) => ({
      id: item.id,
      body: item.body ?? '',
      htmlUrl: item.html_url,
      createdAt: item.created_at,
      user: item.user,
    })),
    nextUrl: nextPageUrl(response.headers.get('Link')),
  };
  cacheSet(key, page);
  return page;
}
