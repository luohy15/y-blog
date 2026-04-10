import PostPage from '@/components/PostPage';
import { useLanguage } from '@/contexts/LanguageContext';

export default function HomePage() {
  const { currentLanguage } = useLanguage();
  const lang = currentLanguage === 'en' ? undefined : currentLanguage;

  return <PostPage slug="about" lang={lang} showTime={false} showToc={false} />;
}
