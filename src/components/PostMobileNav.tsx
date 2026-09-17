import { useEffect, useRef, useState } from 'react';
import { ChevronDown, List, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RelatedList from '@/components/RelatedList';
import TocContent from '@/components/TocContent';
import { useTocNavigation } from '@/components/useTocNavigation';
import { getTranslation } from '@/lib/translations';
import type { LanguageCode } from '@/lib/language';
import type { RelatedGroup } from '@/lib/tags';
import type { TocItem } from '@/lib/toc';

type OpenPanel = 'nav' | 'toc' | null;

interface PostMobileNavProps {
  groups: RelatedGroup[];
  tocItems: TocItem[];
  language: LanguageCode;
}

export default function PostMobileNav({ groups, tocItems, language }: PostMobileNavProps) {
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const tocRef = useRef<HTMLDivElement>(null);
  const { activeId, scrollToSection } = useTocNavigation(tocItems);

  const hasNav = groups.length > 0;
  const hasToc = tocItems.length > 0;

  const closePanel = (restoreFocus: boolean) => {
    const which = openPanel;
    setOpenPanel(null);
    if (!restoreFocus) return;
    const root = which === 'nav' ? navRef.current : which === 'toc' ? tocRef.current : null;
    root?.querySelector('button')?.focus();
  };

  useEffect(() => {
    if (!openPanel) return;

    function handlePointer(event: MouseEvent) {
      const target = event.target as Node;
      const inNav = navRef.current?.contains(target);
      const inToc = tocRef.current?.contains(target);
      if (!inNav && !inToc) closePanel(true);
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') closePanel(true);
    }

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [openPanel]);

  if (!hasNav && !hasToc) {
    return null;
  }

  const triggerClass = (open: boolean) =>
    `rounded-full w-12 h-12 p-0 backdrop-blur-sm border-2 shadow-lg ${
      open
        ? 'bg-blue-100 border-blue-200 text-blue-900 dark:bg-blue-900/40 dark:border-blue-800 dark:text-blue-300'
        : 'bg-white/90 dark:bg-slate-800/90'
    }`;

  return (
    <div className="min-[1100px]:hidden">
      {openPanel && (
        <div
          className="fixed top-20 inset-x-0 bottom-0 z-30 bg-slate-900/5"
          aria-hidden="true"
        />
      )}

      {hasNav && (
        <div
          ref={navRef}
          className="fixed z-40 left-[max(8px,env(safe-area-inset-left))] bottom-[max(16px,env(safe-area-inset-bottom))]"
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpenPanel(openPanel === 'nav' ? null : 'nav')}
            aria-label={getTranslation(language, 'tags.mobileControl')}
            aria-expanded={openPanel === 'nav'}
            aria-controls="mobile-related"
            className={triggerClass(openPanel === 'nav')}
          >
            <Tag className="w-5 h-5" />
          </Button>
          {openPanel === 'nav' && (
            <section
              id="mobile-related"
              aria-label={getTranslation(language, 'tags.related')}
              className="absolute bottom-14 left-0 w-64 max-w-[calc(100vw-2rem)] max-h-[60vh] p-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {getTranslation(language, 'tags.related')}
                </h3>
                <button
                  type="button"
                  onClick={() => closePanel(true)}
                  aria-label={getTranslation(language, 'tags.closeRelated')}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1.5 -m-1.5"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-y-auto overscroll-contain">
                <RelatedList groups={groups} language={language} onNavigate={() => closePanel(false)} />
              </div>
            </section>
          )}
        </div>
      )}

      {hasToc && (
        <div
          ref={tocRef}
          className="fixed z-40 right-[max(8px,env(safe-area-inset-right))] bottom-[max(16px,env(safe-area-inset-bottom))]"
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpenPanel(openPanel === 'toc' ? null : 'toc')}
            aria-label={getTranslation(language, 'tags.toc')}
            aria-expanded={openPanel === 'toc'}
            aria-controls="mobile-toc"
            className={triggerClass(openPanel === 'toc')}
          >
            <List className="w-5 h-5" />
          </Button>
          {openPanel === 'toc' && (
            <section
              id="mobile-toc"
              aria-label={getTranslation(language, 'tags.toc')}
              className="absolute bottom-14 right-0 w-64 max-w-[calc(100vw-2rem)] max-h-[60vh] p-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {getTranslation(language, 'tags.toc')}
                </h3>
                <button
                  type="button"
                  onClick={() => closePanel(true)}
                  aria-label={getTranslation(language, 'tags.closeToc')}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1.5 -m-1.5"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-y-auto overscroll-contain">
                <TocContent
                  tocItems={tocItems}
                  activeId={activeId}
                  onItemClick={(id) => {
                    scrollToSection(id);
                    closePanel(false);
                  }}
                />
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
