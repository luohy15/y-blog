export const COMMENTS_REPO = 'luohy15/y-blog-content';
export const COMMENT_TITLE_PREFIX = '[Comments] ';

const MARKER_RE = /<!--\s*y-blog-comment-thread:\s*([^\s>]+)\s*-->/;
const API_ROOT = `https://api.github.com/repos/${COMMENTS_REPO}`;

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

async function githubGet(url: string): Promise<Response> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}`);
  }
  return response;
}

export async function listThreadIssues(): Promise<IssueLike[]> {
  const response = await githubGet(`${API_ROOT}/issues?state=all&per_page=100`);
  const issues = await response.json() as IssueLike[];
  return issues;
}

export async function findThreadForSlug(slug: string): Promise<CommentThread | null> {
  return findThread(await listThreadIssues(), slug);
}

export async function listComments(thread: CommentThread, pageUrl?: string): Promise<CommentPage> {
  const url = pageUrl ?? `${API_ROOT}/issues/${thread.number}/comments?per_page=100`;
  const response = await githubGet(url);
  const raw = await response.json() as RawComment[];
  return {
    comments: raw.map((item) => ({
      id: item.id,
      body: item.body ?? '',
      htmlUrl: item.html_url,
      createdAt: item.created_at,
      user: item.user,
    })),
    nextUrl: nextPageUrl(response.headers.get('Link')),
  };
}
