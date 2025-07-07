'use client';

import React from 'react';
import { TocItem } from '@/lib/toc';
import { useTocNavigation } from '@/components/useTocNavigation';
import TocContent from '@/components/TocContent';

interface TOCDesktopProps {
  tocItems: TocItem[];
}

export default function TOCDesktop({ tocItems }: TOCDesktopProps) {
  const { activeId, scrollToSection } = useTocNavigation(tocItems);

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <div className="hidden sm:block">
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg p-4 max-h-[60vh] overflow-y-auto">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
          Table of Contents
        </h3>
        <TocContent 
          tocItems={tocItems} 
          activeId={activeId} 
          onItemClick={scrollToSection} 
        />
      </div>
    </div>
  );
}
