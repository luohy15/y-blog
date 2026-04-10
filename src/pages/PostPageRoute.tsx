import { useParams, Navigate } from 'react-router-dom';
import PostPage from '@/components/PostPage';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageCode, languages } from '@/lib/language';
import redirects from '@/redirects.json';

export default function PostPageRoute() {
  const { param, slug } = useParams<{ param: string; slug?: string }>();
  const { currentLanguage } = useLanguage();

  if (!param) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-muted-foreground">Page not found</div>
    </div>;
  }

  // Check redirects
  const redirectMap = redirects as Record<string, string>;
  const targetSlug = slug || param;
  if (targetSlug in redirectMap) {
    const newSlug = redirectMap[targetSlug];
    const newPath = slug
      ? `/${param}/${newSlug}`
      : (param in languages ? `/${param}/${newSlug}` : `/${newSlug}`);
    return <Navigate to={newPath} replace />;
  }

  // If param is a language code and there's a slug
  if (slug) {
    const isLanguage = param in languages && param !== 'en';
    if (!isLanguage) {
      return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Page not found</div>
      </div>;
    }
    return <PostPage slug={slug} lang={param as LanguageCode} showToc={true} />;
  }

  // param could be a language code or a blog slug
  const isLanguage = param in languages && param !== 'en';

  if (isLanguage) {
    // Show about page for that language
    return <PostPage slug="about" lang={param as LanguageCode} showTime={false} showToc={false} />;
  }

  // Treat as blog post slug
  return <PostPage slug={param} lang={currentLanguage === 'en' ? undefined : currentLanguage} showToc={true} />;
}
