import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getBlogPost, formatDate, getPostHref, getDateSegments, getPostHistoryUrl } from '@/lib/blog';
import { LanguageCode } from '@/lib/language';
import { getTranslation } from '@/lib/translations';
import { getTagHref, relatedGroups } from '@/lib/tags';
import Markdown from '@/components/Markdown';
import TOCDesktop from '@/components/TOCDesktop';
import ArticleNavDesktop from '@/components/ArticleNavDesktop';
import PostMobileNav from '@/components/PostMobileNav';
import { extractTocFromMarkdown } from '@/lib/toc';
import type { BlogPost } from '@/lib/blog';
import type { TocItem } from '@/lib/toc';

interface PostPageProps {
  slug?: string;
  lang?: LanguageCode;
  showTime?: boolean;
  showToc?: boolean;
  expectedDate?: { yyyy: string; mm: string; dd: string };
}

const TAG_COLORS = [
  'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
  'bg-cyan-100 text-cyan-800 border-cyan-200 hover:bg-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800',
];

function tagColorClass(tag: string): string {
  const hash = tag.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

export default function PostPage({ slug = '', lang, showTime = true, showToc = true, expectedDate }: PostPageProps) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [content, setContent] = useState<string>('');
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const language: LanguageCode = lang || 'en';

  useEffect(() => {
    let cancelled = false;

    async function fetchPost() {
      setLoading(true);
      setNotFound(false);

      const result = await getBlogPost(slug, lang);

      if (cancelled) return;

      if (!result) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (expectedDate) {
        const segs = getDateSegments(result.post.create_time);
        if (!segs || segs.yyyy !== expectedDate.yyyy || segs.mm !== expectedDate.mm || segs.dd !== expectedDate.dd) {
          setNotFound(true);
          setLoading(false);
          return;
        }
      }

      setPost(result.post);
      setPosts(result.posts);
      setContent(result.content);
      setTocItems(showToc ? extractTocFromMarkdown(result.content) : []);
      setLoading(false);

      if (result.post.title) {
        document.title = `${result.post.title} - Huayi Luo`;
      }
    }

    fetchPost();

    return () => { cancelled = true; };
  }, [slug, lang, showToc, expectedDate?.yyyy, expectedDate?.mm, expectedDate?.dd]);

  useEffect(() => {
    if (!post || slug === 'about') return;

    const href = window.location.origin + getPostHref(post, lang);
    let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const created = !link;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = href;

    return () => {
      if (created && link && link.parentNode) {
        link.parentNode.removeChild(link);
      }
    };
  }, [post, lang, slug]);

  // Deep-link: once content has rendered, scroll to the heading matching the
  // URL hash. ScrollToTop bails when a hash is present, so we handle it here.
  useEffect(() => {
    if (loading || !post) return;
    const hash = window.location.hash;
    if (!hash) return;

    const id = decodeURIComponent(hash.slice(1));
    // Wait for layout so scroll-margin-top lands the heading below the header.
    const raf = requestAnimationFrame(() => {
      const element = document.getElementById(id);
      if (element) element.scrollIntoView();
    });

    return () => cancelAnimationFrame(raf);
  }, [loading, post, content]);

  const groups = useMemo(() => (post ? relatedGroups(posts, post) : []), [post, posts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Post not found</div>
      </div>
    );
  }

  const visibleToc = showToc ? tocItems : [];

  return (
    <div className="min-h-screen bg-background">
      <PostMobileNav groups={groups} tocItems={visibleToc} language={language} />

      <div className="flex justify-center">
        {groups.length > 0 && (
          <div className="hidden min-[1100px]:block w-56 fixed left-8 top-24 2xl:left-40">
            <ArticleNavDesktop groups={groups} language={language} />
          </div>
        )}

        <div className={`flex flex-col px-4 sm:px-0 pb-28 pt-4 w-full sm:w-[50%] 2xl:w-[40%] max-w-[100%] space-y-4`}>
          <article className="bg-card rounded-lg border shadow-sm p-4 sm:p-6 lg:p-8">
            <header className="mb-6 sm:mb-8 pb-6 border-b border-border">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 leading-tight">
                {post.title}
              </h1>

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag, index) => (
                    <Link
                      key={index}
                      to={getTagHref(tag, language)}
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium transition-colors border break-words min-w-0 ${tagColorClass(tag)}`}
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              )}

              {showTime && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
                    </svg>
                    <time dateTime={post.create_time}>
                      {getTranslation(lang || 'en', 'common.created')} {formatDate(post.create_time, lang)}
                    </time>
                  </div>
                  {post.update_time !== post.create_time && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <time dateTime={post.update_time}>
                        {getTranslation(lang || 'en', 'common.updated')} {formatDate(post.update_time, lang)}
                      </time>
                    </div>
                  )}
                  {(() => {
                    const historyUrl = getPostHistoryUrl(post);
                    if (!historyUrl) return null;
                    return (
                      <a
                        href={historyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
                        title={getTranslation(lang || 'en', 'common.history')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{getTranslation(lang || 'en', 'common.history')}</span>
                      </a>
                    );
                  })()}
                </div>
              )}
            </header>

            <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
              <Markdown content={content} />
            </div>
          </article>
        </div>

        {visibleToc.length > 0 && (
          <div className="hidden min-[1100px]:block w-56 fixed right-8 top-24 2xl:right-40">
            <TOCDesktop tocItems={visibleToc} language={language} />
          </div>
        )}
      </div>
    </div>
  );
}
