import { notFound } from 'next/navigation';
import { getBlogPost, formatDate } from '@/lib/blog';
import Markdown from '@/components/Markdown';
import TOCMobile from '@/components/TOCMobile';
import TOCDesktop from '@/components/TOCDesktop';
import { extractTocFromMarkdown } from '@/lib/toc';

interface PostPageProps {
  slug?: string;
  showTime?: boolean;
  showToc?: boolean;
}

export default async function PostPage({ slug = '', showTime = true, showToc = true }: PostPageProps) {
  const result = await getBlogPost(slug);

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
        <div className="hidden sm:block sm:w-[20%] h-[calc(50vh)] fixed left-8 top-20 2xl:left-40">
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
              {showTime && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
                    </svg>
                    <time dateTime={post.create_time}>
                      Created {formatDate(post.create_time)}
                    </time>
                  </div>
                  {post.update_time !== post.create_time && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <time dateTime={post.update_time}>
                        Updated {formatDate(post.update_time)}
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
