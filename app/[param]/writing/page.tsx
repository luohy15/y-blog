import { LanguageCode } from '@/lib/language';
import WritingListPage from '@/components/WritingListPage';
import type { Metadata } from 'next';
import { generateWritingMetadata } from '@/lib/metadata';

interface PageProps {
  params: Promise<{
    param: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { param } = await params;
  
  // Verify param is a valid language code
  const validLanguages: LanguageCode[] = ['ja', 'zhs', 'zht'];
  if (!validLanguages.includes(param as LanguageCode)) {
    return {
      title: "Huayi Luo"
    };
  }
  
  return generateWritingMetadata(param as LanguageCode);
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
