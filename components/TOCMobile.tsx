'use client';

import React, { useState, useRef, useEffect } from 'react';
import { TocItem } from '@/lib/toc';
import { Button } from '@/components/ui/button';
import { ChevronDown, List } from 'lucide-react';
import { useTocNavigation } from '@/components/useTocNavigation';
import TocContent from '@/components/TocContent';

interface TOCMobileProps {
  tocItems: TocItem[];
}

export default function TOCMobile({ tocItems }: TOCMobileProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { activeId, scrollToSection } = useTocNavigation(tocItems);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (tocItems.length === 0) {
    return null;
  }

  const handleItemClick = (id: string) => {
    scrollToSection(id);
    setIsExpanded(false); // Close mobile TOC after clicking
  };

  return (
    <div className="block sm:hidden">
      <div className="fixed bottom-4 right-2 z-50" ref={containerRef}>
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="rounded-full w-12 h-12 p-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-2 shadow-lg"
        >
          <List className="w-5 h-5" />
        </Button>
        
        {isExpanded && (
          <div className="absolute bottom-14 right-0 w-64 max-w-[calc(100vw-2rem)] max-h-[60vh] p-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Table of Contents
              </h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto">
              <TocContent 
                tocItems={tocItems} 
                activeId={activeId} 
                onItemClick={handleItemClick} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
