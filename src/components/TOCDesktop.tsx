import { TocItem } from '@/lib/toc';
import { useTocNavigation } from '@/components/useTocNavigation';
import TocContent from '@/components/TocContent';
import { getTranslation } from '@/lib/translations';
import type { LanguageCode } from '@/lib/language';

interface TOCDesktopProps {
  tocItems: TocItem[];
  language: LanguageCode;
}

export default function TOCDesktop({ tocItems, language }: TOCDesktopProps) {
  const { activeId, scrollToSection } = useTocNavigation(tocItems);

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg p-4 max-h-[60vh] overflow-y-auto overscroll-contain">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
        {getTranslation(language, 'tags.toc')}
      </h3>
      <TocContent
        tocItems={tocItems}
        activeId={activeId}
        onItemClick={scrollToSection}
      />
    </div>
  );
}
