import { LanguageCode } from '@/lib/language';
import WritingListPage from '@/components/WritingListPage';

interface PageProps {
  params: Promise<{
    param: string;
  }>;
}

export async function generateStaticParams() {
  const validLanguages: LanguageCode[] = ['ja', 'zhs', 'zht'];
  
  return validLanguages.map(lang => ({ param: lang }));
}

export default async function LanguageWritingPage({ params }: PageProps) {
  const { param } = await params;
  
  // Verify param is a valid language code
  const validLanguages: LanguageCode[] = ['ja', 'zhs', 'zht'];
  if (!validLanguages.includes(param as LanguageCode)) {
    return <div>Invalid language code</div>;
  }
  
  const language = param as LanguageCode;

  return <WritingListPage language={language} />;
}
