import { useEffect, useRef, useState } from 'react';
import Markdown from '@/components/Markdown';
import type { LanguageCode } from '@/lib/language';
import { getTranslation } from '@/lib/translations';
import {
  findThreadForSlug,
  listComments,
  newThreadUrl,
  repoIssuesUrl,
  type CommentThread,
  type ThreadComment,
} from '@/lib/comments';

interface CommentSectionProps {
  slug: string;
  language: LanguageCode;
  articleUrl: string;
}

type Status = 'loading' | 'empty' | 'error' | 'ready';

function formatCommentTime(iso: string, language: LanguageCode): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const locale = language === 'zhs' ? 'zh-Hans' : language === 'zht' ? 'zh-Hant' : language;
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CommentSection({ slug, language, articleUrl }: CommentSectionProps) {
  const [status, setStatus] = useState<Status>('loading');
  const [thread, setThread] = useState<CommentThread | null>(null);
  const [comments, setComments] = useState<ThreadComment[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(false);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    requestRef.current = controller;
    let cancelled = false;
    setStatus('loading');
    setThread(null);
    setComments([]);
    setNextUrl(null);
    setLoadingMore(false);
    setMoreError(false);

    findThreadForSlug(slug, controller.signal)
      .then(async (found) => {
        if (cancelled) return;
        if (!found) {
          setStatus('empty');
          return;
        }
        const page = await listComments(found, undefined, controller.signal);
        if (cancelled) return;
        setThread(found);
        setComments(page.comments);
        setNextUrl(page.nextUrl);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
      controller.abort();
      if (requestRef.current === controller) requestRef.current = null;
    };
  }, [slug]);

  async function loadMore() {
    if (!thread || !nextUrl || loadingMore) return;
    const signal = requestRef.current?.signal;
    setLoadingMore(true);
    setMoreError(false);
    try {
      const page = await listComments(thread, nextUrl, signal);
      if (signal?.aborted) return;
      setComments((current) => [...current, ...page.comments]);
      setNextUrl(page.nextUrl);
    } catch {
      if (!signal?.aborted) setMoreError(true);
    } finally {
      if (!signal?.aborted) setLoadingMore(false);
    }
  }

  const text = (key: string) => getTranslation(language, key);
  const createUrl = newThreadUrl(slug, articleUrl);

  return (
    <section aria-labelledby="comments-heading" className="bg-card rounded-lg border shadow-sm p-4 sm:p-6 lg:p-8">
      <h2 id="comments-heading" className="text-xl font-bold text-foreground mb-4">
        {text('comments.title')}
      </h2>

      {status === 'loading' && (
        <p className="text-sm text-muted-foreground">{text('comments.loading')}</p>
      )}

      {status === 'error' && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{text('comments.error')}</p>
          <a
            href={repoIssuesUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {text('comments.openOnGitHub')}
          </a>
        </div>
      )}

      {status === 'empty' && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{text('comments.empty')}</p>
          <a
            href={createUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            {text('comments.cta')}
          </a>
        </div>
      )}

      {status === 'ready' && thread && (
        <div className="space-y-6">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">{text('comments.empty')}</p>
          ) : (
            <ul className="space-y-6">
              {comments.map((comment) => {
                const login = comment.user?.login ?? text('comments.deletedUser');
                return (
                  <li key={comment.id} className="flex gap-3">
                    {comment.user ? (
                      <img
                        src={comment.user.avatar_url}
                        alt=""
                        className="w-8 h-8 rounded-full shrink-0"
                      />
                    ) : (
                      <span aria-hidden="true" className="w-8 h-8 rounded-full shrink-0 bg-muted" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        {comment.user ? (
                          <a
                            href={comment.user.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-foreground hover:underline"
                          >
                            {login}
                          </a>
                        ) : (
                          <span className="font-medium text-muted-foreground">{login}</span>
                        )}
                        <time dateTime={comment.createdAt} className="text-muted-foreground">
                          {formatCommentTime(comment.createdAt, language)}
                        </time>
                        <a
                          href={comment.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground hover:underline"
                        >
                          {text('comments.viewOnGitHub')}
                        </a>
                      </div>
                      <Markdown content={comment.body} safe className="prose-sm mt-2" />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {nextUrl && (
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
            >
              {loadingMore ? text('comments.loading') : text('comments.loadMore')}
            </button>
          )}
          {moreError && (
            <p className="text-sm text-muted-foreground">{text('comments.error')}</p>
          )}

          <a
            href={thread.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            {text('comments.cta')}
          </a>
        </div>
      )}
    </section>
  );
}

const LAZY_ROOT_MARGIN = '400px 0px';

export function LazyCommentSection(props: CommentSectionProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    if (activated) return;
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setActivated(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setActivated(true);
      },
      { rootMargin: LAZY_ROOT_MARGIN },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [activated]);

  if (activated) return <CommentSection {...props} />;

  const text = (key: string) => getTranslation(props.language, key);

  return (
    <section
      ref={containerRef}
      aria-labelledby="comments-heading"
      className="bg-card rounded-lg border shadow-sm p-4 sm:p-6 lg:p-8"
    >
      <h2 id="comments-heading" className="text-xl font-bold text-foreground mb-4">
        {text('comments.title')}
      </h2>
      <p className="text-sm text-muted-foreground">{text('comments.loading')}</p>
    </section>
  );
}
