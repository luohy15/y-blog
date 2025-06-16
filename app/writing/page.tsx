import WritingListPage from '@/components/WritingListPage';
import type { Metadata } from 'next';
import { generateWritingMetadata } from '@/lib/metadata';

export const metadata: Metadata = generateWritingMetadata();

export default function WritingPage() {
  return <WritingListPage />;
}
