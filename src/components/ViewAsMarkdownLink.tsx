import { useLocation } from 'react-router-dom';
import type { LanguageCode } from '@/lib/language';
import { markdownPathFor } from '@/lib/markdown';
import { getTranslation } from '@/lib/translations';

export default function ViewAsMarkdownLink({ language }: { language: LanguageCode }) {
  const location = useLocation();

  return (
    <a
      href={markdownPathFor(location.pathname)}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth={2} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 15V9l3 3 3-3v6m5-6v6m-2-2 2 2 2-2" />
      </svg>
      <span>{getTranslation(language, 'common.viewAsMarkdown')}</span>
    </a>
  );
}
