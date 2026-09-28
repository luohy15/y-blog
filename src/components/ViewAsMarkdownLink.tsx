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
      {getTranslation(language, 'common.viewAsMarkdown')}
    </a>
  );
}
