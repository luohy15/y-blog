import { useParams, Navigate } from 'react-router-dom';
import PostPage from '@/components/PostPage';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageCode, languages } from '@/lib/language';
import redirects from '@/redirects.json';

const NotFound = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-muted-foreground">Page not found</div>
  </div>
);

const isYear = (s?: string): s is string => !!s && /^\d{4}$/.test(s);
const isMonth = (s?: string): s is string => !!s && /^(0[1-9]|1[0-2])$/.test(s);
const isDay = (s?: string): s is string => !!s && /^(0[1-9]|[12]\d|3[01])$/.test(s);

export default function PostPageRoute() {
  const { param, slug, yyyy, mm, dd, lang } = useParams<{
    param?: string;
    slug?: string;
    yyyy?: string;
    mm?: string;
    dd?: string;
    lang?: string;
  }>();
  const { currentLanguage } = useLanguage();
  const redirectMap = redirects as Record<string, string>;

  // Dated routes: /:yyyy/:mm/:dd/:slug or /:lang/:yyyy/:mm/:dd/:slug
  if (yyyy !== undefined || mm !== undefined || dd !== undefined) {
    if (!isYear(yyyy) || !isMonth(mm) || !isDay(dd) || !slug) {
      return <NotFound />;
    }

    let resolvedLang: LanguageCode | undefined;
    if (lang !== undefined) {
      const isValidLang = lang in languages && lang !== 'en';
      if (!isValidLang) {
        return <NotFound />;
      }
      resolvedLang = lang as LanguageCode;
    } else {
      resolvedLang = currentLanguage === 'en' ? undefined : currentLanguage;
    }

    const finalSlug = slug in redirectMap ? redirectMap[slug] : slug;
    return <PostPage slug={finalSlug} lang={resolvedLang} showToc={true} expectedDate={{ yyyy, mm, dd }} />;
  }

  // Legacy 1-segment / 2-segment paths
  if (!param) {
    return <NotFound />;
  }

  const targetSlug = slug || param;
  if (targetSlug in redirectMap) {
    const newSlug = redirectMap[targetSlug];
    const newPath = slug
      ? `/${param}/${newSlug}`
      : (param in languages ? `/${param}/${newSlug}` : `/${newSlug}`);
    return <Navigate to={newPath} replace />;
  }

  if (slug) {
    const isLanguage = param in languages && param !== 'en';
    if (!isLanguage) {
      return <NotFound />;
    }
    return <PostPage slug={slug} lang={param as LanguageCode} showToc={true} />;
  }

  const isLanguage = param in languages && param !== 'en';

  if (isLanguage) {
    return <PostPage slug="about" lang={param as LanguageCode} showTime={false} showToc={false} />;
  }

  return <PostPage slug={param} lang={currentLanguage === 'en' ? undefined : currentLanguage} showToc={true} />;
}
