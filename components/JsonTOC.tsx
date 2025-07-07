'use client';

import React, { useState, useEffect } from 'react';
import { JsonTocItem } from '@/lib/json-utils';
import { Button } from '@/components/ui/button';
import { ChevronDown, List } from 'lucide-react';

interface JsonTOCProps {
  tocItems: JsonTocItem[];
}

export default function JsonTOC({ tocItems }: JsonTOCProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeId, setActiveId] = useState<string>('');

  // Handle smooth scrolling to section
  const scrollToSection = (id: string) => {
    console.log(`click json section ${id}`);
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

    // Observe all JSON sections
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
          key={item.id || `json-item-${index}`}
          onClick={() => scrollToSection(item.id)}
          className={`block w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            item.level === 2 ? 'ml-4' : ''
          } ${
            activeId === item.id
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-300'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 mr-2">
            {item.level === 1 ? '{}' : '→'}
          </span>
          {item.text}
        </button>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile JSON TOC - Fixed Top Right */}
      <div className="block sm:hidden">
        <div className="fixed top-16 right-4 z-50">
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-full w-12 h-12 p-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-2 shadow-lg border-purple-200 dark:border-purple-700"
          >
            <List className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </Button>
          
          {isExpanded && (
            <div className="absolute top-14 right-0 w-64 max-w-[calc(100vw-2rem)] p-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg border border-purple-200 dark:border-purple-700 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center">
                  <span className="mr-2 text-purple-600 dark:text-purple-400">📄</span>
                  JSON Navigation
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

      {/* Desktop JSON TOC - Integrated into layout */}
      <div className="hidden sm:block">
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg border border-purple-200 dark:border-purple-700 shadow-lg p-4 overflow-y-auto mb-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center">
            <span className="mr-2 text-purple-600 dark:text-purple-400">📄</span>
            JSON Navigation
          </h3>
          <TocContent />
        </div>
      </div>
    </>
  );
}
