import { useEffect } from 'react';
import WritingListPage from '@/components/WritingListPage';
import { useLanguage } from '@/contexts/LanguageContext';

export default function WritingPage() {
  const { currentLanguage } = useLanguage();

  useEffect(() => {
    document.title = 'Writing - Huayi Luo';
  }, []);

  return <WritingListPage language={currentLanguage} />;
}
