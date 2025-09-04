import { notFound } from 'next/navigation';
import { getBlogPost, formatDate } from '@/lib/blog';
import { LanguageCode } from '@/lib/language';
import { getTranslation } from '@/lib/translations';
import Markdown from '@/components/Markdown';
import TOCMobile from '@/components/TOCMobile';
import TOCDesktop from '@/components/TOCDesktop';
import { extractTocFromMarkdown } from '@/lib/toc';

interface PostPageProps {
  slug?: string;
  lang?: LanguageCode;
  showTime?: boolean;
  showToc?: boolean;
}

export default async function PostPage({ slug = '', lang, showTime = true, showToc = true }: PostPageProps) {
  const result = await getBlogPost(slug, lang);

  if (!result) {
    notFound();
  }

  const { post, content } = result;
  const tocItems = showToc ? extractTocFromMarkdown(content) : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile TOC */}
      {showToc && <TOCMobile tocItems={tocItems} />}
      
      {/* Main content with messages and TOC */}
      <div className="flex justify-center">
        {/* Table of Contents (Desktop) */}
        <div className="hidden sm:block sm:w-[20%] h-[calc(50vh)] fixed left-8 top-24 2xl:left-40">
          {showToc && <TOCDesktop tocItems={tocItems} />}
        </div>

        {/* Messages (centered) */}
        <div className={`flex flex-col px-4 sm:px-0 pb-28 pt-4 w-full sm:w-[50%] 2xl:w-[40%] max-w-[100%] space-y-4`}>
          {/* Article */}
          <article className="bg-card rounded-lg border shadow-sm p-4 sm:p-6 lg:p-8">
            <header className="mb-6 sm:mb-8 pb-6 border-b border-border">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 leading-tight">
                {post.title}
              </h1>
              
              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag, index) => {
                    // Generate consistent colors based on tag content
                    const colors = [
                      'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
                      'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
                      'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
                      'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
                      'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
                      'bg-cyan-100 text-cyan-800 border-cyan-200 hover:bg-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800',
                    ];
                    
                    // Simple hash function to consistently assign colors
                    const hash = tag.split('').reduce((a, b) => {
                      a = ((a << 5) - a) + b.charCodeAt(0);
                      return a & a;
                    }, 0);
                    const colorClass = colors[Math.abs(hash) % colors.length];
                    
                    return (
                      <span
                        key={index}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium transition-colors border ${colorClass}`}
                      >
                        {tag}
                      </span>
                    );
                  })}
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
                </div>
              )}
            </header>

            <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
              <Markdown content={content} />
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
