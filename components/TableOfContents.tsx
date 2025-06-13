'use client';

import React, { useState, useEffect } from 'react';
import { TocItem } from '@/lib/toc';
import { Button } from '@/components/ui/button';
import { ChevronDown, List } from 'lucide-react';

interface TableOfContentsProps {
  tocItems: TocItem[];
}

export default function TableOfContents({ tocItems }: TableOfContentsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeId, setActiveId] = useState<string>('');

  // Handle smooth scrolling to section
  const scrollToSection = (id: string) => {
    console.log(`click ${id}`)
    const element = document.getElementById(id);
    const header = document.querySelector('header');
    
    if (element && header) {
      const headerHeight = header.offsetHeight;
      const elementPosition = element.offsetTop;
      const offsetPosition = elementPosition - headerHeight - 16; // 16px buffer for better spacing
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      // Close mobile TOC after clicking
      setIsExpanded(false);
    }
  };

  // Track which section is currently visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { 
        rootMargin: '-20% 0px -80% 0px',
        threshold: 0
      }
    );

    // Observe all headings
    tocItems.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [tocItems]);

  if (tocItems.length === 0) {
    return null;
  }

  const TocContent = () => (
    <nav className="space-y-1">
      {tocItems.map((item, index) => (
        <button
          key={item.id || `item-${index}`}
          onClick={() => scrollToSection(item.id)}
          className={`block w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeId === item.id
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {item.text}
        </button>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile TOC - Fixed Top Right */}
      <div className="block sm:hidden">
        <div className="fixed top-4 right-4 z-50">
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-full w-12 h-12 p-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-2 shadow-lg"
          >
            <List className="w-5 h-5" />
          </Button>
          
          {isExpanded && (
            <div className="absolute top-14 right-0 w-64 max-w-[calc(100vw-2rem)] p-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl">
              <div className="flex items-center justify-between mb-3">
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
              <TocContent />
            </div>
          )}
        </div>
      </div>

      {/* Desktop TOC - Integrated into layout */}
      <div className="hidden sm:block">
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Table of Contents
          </h3>
          <TocContent />
        </div>
      </div>
    </>
  );
}
