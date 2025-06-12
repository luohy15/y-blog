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
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
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
      
      if (item.children) {
        item.children.forEach((child) => {
          const childElement = document.getElementById(child.id);
          if (childElement) observer.observe(childElement);
        });
      }
    });

    return () => observer.disconnect();
  }, [tocItems]);

  if (tocItems.length === 0) {
    return null;
  }

  const TocContent = () => (
    <nav className="space-y-1">
      {tocItems.map((item) => (
        <div key={item.id}>
          {/* H1 Item */}
          <button
            onClick={() => scrollToSection(item.id)}
            className={`block w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeId === item.id
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {item.text}
          </button>
          
          {/* H2 Children */}
          {item.children && item.children.length > 0 && (
            <div className="ml-4 space-y-1">
              {item.children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => scrollToSection(child.id)}
                  className={`block w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors ${
                    activeId === child.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {child.text}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile TOC - Fixed Top Right */}
      <div className="sm:hidden">
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

      {/* Desktop TOC - Fixed Left Center */}
      <div className="hidden sm:block">
        <div className="fixed top-1/3 left-4 -translate-y-1/2 z-50 w-64">
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg p-4 max-h-[70vh] overflow-y-auto">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Table of Contents
            </h3>
            <TocContent />
          </div>
        </div>
      </div>
    </>
  );
}
