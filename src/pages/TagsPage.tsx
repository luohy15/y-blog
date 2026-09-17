import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { getBlogPosts, formatDate, getPostHref, type BlogPost } from '@/lib/blog';
import { getTranslation } from '@/lib/translations';
import { addLanguageToPath, getLanguageFromPath, type LanguageCode } from '@/lib/language';
import {
  articlesForTag,
  collectTags,
  getTagHref,
  getTagsIndexHref,
  legacyRedirectTarget,
  resolveSelectedTag,
} from '@/lib/tags';

function TagChoice({
  tag,
  selected,
  language,
}: {
  tag: string;
  selected: boolean;
  language: LanguageCode;
}) {
  return (
    <Link
      to={getTagHref(tag, language)}
      aria-current={selected ? 'page' : undefined}
      className={`flex items-center justify-between gap-2 min-h-11 px-3 py-2.5 mb-1 rounded-md break-words ${
        selected
          ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300 font-semibold'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      <span className="min-w-0">{tag}</span>
      {selected ? <span aria-hidden="true">✓</span> : null}
    </Link>
  );
}

function ArticleRows({ posts, language }: { posts: BlogPost[]; language: LanguageCode }) {
  return (
    <div className="space-y-2">
      {posts.map((post) => (
        <article key={post.url} className="group">
          <Link to={getPostHref(post, language)} className="block py-3 hover:bg-muted/50 transition-colors">
            <div className="text-sm text-muted-foreground mb-1">
              <time dateTime={post.create_time}>
                {getTranslation(language, 'common.created')} {formatDate(post.create_time, language)}
              </time>
              {post.update_time !== post.create_time && (
                <span className="ml-2">
                  • {getTranslation(language, 'common.updated')} {formatDate(post.update_time, language)}
                </span>
              )}
            </div>
            <h3 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">
              {post.title}
            </h3>
          </Link>
        </article>
      ))}
    </div>
  );
}

export default function TagsPage() {
  const { tagSegment } = useParams<{ tagSegment?: string }>();
  const location = useLocation();
  const urlLanguage = getLanguageFromPath(location.pathname);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Tags - Huayi Luo';
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchPosts() {
      setLoading(true);
      const fetched = await getBlogPosts(urlLanguage !== 'en' ? urlLanguage : undefined);
      if (!cancelled) {
        setPosts(fetched);
        setLoading(false);
      }
    }

    fetchPosts();
    return () => {
      cancelled = true;
    };
  }, [urlLanguage]);

  const tags = useMemo(() => collectTags(posts), [posts]);
  const selected = useMemo(() => resolveSelectedTag(tags, tagSegment), [tags, tagSegment]);
  const selectedArticles = selected.tag ? articlesForTag(posts, selected.tag) : [];
  const redirectTo = !loading ? legacyRedirectTarget(tagSegment, tags, urlLanguage) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (redirectTo != null) {
    return <Navigate to={redirectTo} replace />;
  }

  const writingHref = addLanguageToPath('/writing', urlLanguage);

  if (tags.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-8 lg:py-12">
          <h1 className="text-2xl sm:text-3xl font-bold mb-8">{getTranslation(urlLanguage, 'tags.title')}</h1>
          <div className="text-center py-14 text-muted-foreground">
            <p className="mb-3">{getTranslation(urlLanguage, 'tags.empty')}</p>
            <Link to={writingHref} className="text-foreground underline underline-offset-4">
              {getTranslation(urlLanguage, 'tags.browseWriting')} →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const picker = (
    <nav aria-label={getTranslation(urlLanguage, 'tags.chooseTag')}>
      {tags.map((tag) => (
        <TagChoice
          key={tag}
          tag={tag}
          selected={selected.tag === tag}
          language={urlLanguage}
        />
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8 lg:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold mb-8">{getTranslation(urlLanguage, 'tags.title')}</h1>

        <details key={selected.tag} className="md:hidden mb-6 border border-border rounded-lg bg-card">
          <summary className="flex justify-between items-center gap-3 min-h-12 px-4 py-3 cursor-pointer font-semibold break-words">
            <span>{selected.tag}</span>
            <span aria-hidden="true">⌄</span>
          </summary>
          <div className="px-2 pb-2 max-h-[230px] overflow-y-auto">{picker}</div>
        </details>

        <div className="md:grid md:grid-cols-[224px_minmax(0,1fr)] md:gap-8">
          <div className="hidden md:block border-r border-border pr-5">{picker}</div>
          <section
            className="min-w-0"
            aria-label={
              selected.tag
                ? `${getTranslation(urlLanguage, 'tags.title')} ${selected.tag}`
                : getTranslation(urlLanguage, 'tags.title')
            }
          >
            {selected.tag && (
              <h2 className="text-xl sm:text-2xl font-bold mb-5 break-words">{selected.tag}</h2>
            )}
            {selectedArticles.length === 0 ? (
              <div className="text-muted-foreground">
                <p className="mb-3">{getTranslation(urlLanguage, 'tags.emptyTag')}</p>
                <Link to={getTagsIndexHref(urlLanguage)} className="text-foreground underline underline-offset-4">
                  {getTranslation(urlLanguage, 'tags.allTags')}
                </Link>
              </div>
            ) : (
              <ArticleRows posts={selectedArticles} language={urlLanguage} />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
