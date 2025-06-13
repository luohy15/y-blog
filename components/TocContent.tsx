'use client';

import React from 'react';
import { TocItem } from '@/lib/toc';

interface TocContentProps {
  tocItems: TocItem[];
  activeId: string;
  onItemClick: (id: string) => void;
}

export default function TocContent({ tocItems, activeId, onItemClick }: TocContentProps) {
  return (
    <nav className="space-y-1">
      {tocItems.map((item, index) => (
        <button
          key={item.id || `item-${index}`}
          onClick={() => onItemClick(item.id)}
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
}
