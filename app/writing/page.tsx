import Link from 'next/link';
import { getBlogPosts, formatDate, getSlugFromUrl } from '@/lib/blog';

export default async function WritingPage() {
  const posts = await getBlogPosts();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8 lg:py-12">
        {/* Posts */}
        <main>
          {posts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No posts yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {posts.map((post) => {
                const slug = getSlugFromUrl(post.url);
                return (
                  <article key={post.url} className="group">
                    <Link href={`/${slug}`} className="block py-3 hover:bg-muted/50 transition-colors">
                      <div className="text-sm text-muted-foreground mb-1">
                        <time dateTime={post.create_time}>
                          {formatDate(post.create_time)}
                        </time>
                        {post.update_time !== post.create_time && (
                          <span className="ml-2">• Updated {formatDate(post.update_time)}</span>
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
