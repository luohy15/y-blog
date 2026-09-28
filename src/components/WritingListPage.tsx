import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBlogPosts, formatDate, getPostHref } from '@/lib/blog';
import { getTranslation } from '@/lib/translations';
import { LanguageCode } from '@/lib/language';
import type { BlogPost } from '@/lib/blog';
import ViewAsMarkdownLink from '@/components/ViewAsMarkdownLink';

interface WritingListPageProps {
  language?: LanguageCode;
}

export default function WritingListPage({ language = 'en' }: WritingListPageProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchPosts() {
      setLoading(true);
      const fetchedPosts = await getBlogPosts(language !== 'en' ? language : undefined);
      if (!cancelled) {
        setPosts(fetchedPosts);
        setLoading(false);
      }
    }

    fetchPosts();

    return () => { cancelled = true; };
  }, [language]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex justify-center">
        <div className="flex flex-col px-4 sm:px-0 pb-28 pt-4 w-full sm:w-[50%] 2xl:w-[40%] max-w-[100%] space-y-4">
          <article className="bg-card rounded-lg border shadow-sm p-4 sm:p-6 lg:p-8">
            <header className="mb-6 sm:mb-8 pb-6 border-b border-border">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 leading-tight">
                {getTranslation(language, 'nav.writing')}
              </h1>
              <ViewAsMarkdownLink language={language} />
            </header>
            {posts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{getTranslation(language, 'common.noPosts')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {posts.map((post) => {
                  const linkHref = getPostHref(post, language);

                  return (
                    <article key={post.url} className="group">
                      <Link to={linkHref} className="block py-3 hover:bg-muted/50 transition-colors">
                        <div className="text-sm text-muted-foreground mb-1">
                          <time dateTime={post.create_time}>
                            {getTranslation(language, 'common.created')} {formatDate(post.create_time, language)}
                          </time>
                          {post.update_time !== post.create_time && (
                            <span className="ml-2">• {getTranslation(language, 'common.updated')} {formatDate(post.update_time, language)}</span>
                          )}
                        </div>
                        <h2 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                          {post.title}
                        </h2>
                      </Link>
                    </article>
                  );
                })}
              </div>
            )}
          </article>
        </div>
      </div>
    </div>
  );
}
