import Link from 'next/link';
import { getBlogPosts, formatDate, getSlugFromUrl } from '@/lib/blog';
import { getTranslation } from '@/lib/translations';
import { LanguageCode } from '@/lib/language';

interface WritingListPageProps {
  language?: LanguageCode;
}

export default async function WritingListPage({ language = 'en' }: WritingListPageProps) {
  const posts = await getBlogPosts(language !== 'en' ? language : undefined);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8 lg:py-12">
        <main>
          {posts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{getTranslation(language, 'common.noPosts')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {posts.map((post) => {
                const slug = getSlugFromUrl(post.url);
                const linkHref = language !== 'en' ? `/${language}/${slug}` : `/${slug}`;
                
                return (
                  <article key={post.url} className="group">
                    <Link href={linkHref} className="block py-3 hover:bg-muted/50 transition-colors">
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
        </main>
      </div>
    </div>
  );
}
