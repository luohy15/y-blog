import RelatedList from '@/components/RelatedList';
import { getTranslation } from '@/lib/translations';
import type { LanguageCode } from '@/lib/language';
import type { RelatedGroup } from '@/lib/tags';

interface ArticleNavDesktopProps {
  groups: RelatedGroup[];
  language: LanguageCode;
}

export default function ArticleNavDesktop({ groups, language }: ArticleNavDesktopProps) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="rail-scroll bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg p-4 max-h-[60vh] overflow-y-auto overscroll-contain">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
        {getTranslation(language, 'tags.related')}
      </h3>
      <RelatedList groups={groups} language={language} />
    </div>
  );
}
