'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Components } from 'react-markdown';
import { generateSlug } from '@/lib/toc';

interface MarkdownProps {
  content: string;
  className?: string;
}

// Custom components for ReactMarkdown
const markdownComponents: Components = {
  h1: () => {
    return <div></div>
  },
  h2: ({ children }) => {
    const text = children?.toString() || '';
    const id = generateSlug(text);
    return (
      <h2 
        id={id}
        className="text-2xl sm:text-3xl font-bold mt-6 mb-3 text-slate-900 dark:text-slate-100"
      >
        {children}
      </h2>
    );
  },
  h3: ({ children }) => (
    <h3 className="text-xl sm:text-2xl font-bold mt-5 mb-2 text-slate-900 dark:text-slate-100">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-lg sm:text-xl font-bold mt-4 mb-2 text-slate-900 dark:text-slate-100">
      {children}
    </h4>
  ),
  h5: ({ children }) => (
    <h5 className="text-base sm:text-lg font-bold mt-3 mb-1 text-slate-900 dark:text-slate-100">
      {children}
    </h5>
  ),
  h6: ({ children }) => (
    <h6 className="text-sm sm:text-base font-bold mt-3 mb-1 text-slate-900 dark:text-slate-100">
      {children}
    </h6>
  ),
  p: ({ children }) => (
    <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-6 mb-4 space-y-1">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 mb-4 space-y-1">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-slate-700 dark:text-slate-300">
      {children}
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-slate-50 dark:bg-slate-800/50 rounded-r-md">
      <div className="text-slate-600 dark:text-slate-400 italic">
        {children}
      </div>
    </blockquote>
  ),
  a: ({ href, children, ...props }) => {
    const isExternal = href && (href.startsWith('http') || href.startsWith('https'));
    return (
      <a
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline decoration-blue-600/30 hover:decoration-blue-600 transition-colors break-words overflow-wrap-anywhere"
        {...props}
      >
        {children}
      </a>
    );
  },
  strong: ({ children }) => (
    <strong className="font-bold text-slate-900 dark:text-slate-100">
      {children}
    </strong>
  ),
  em: ({ children }) => (
    <em className="italic text-slate-700 dark:text-slate-300">
      {children}
    </em>
  ),
  code: ({ children, ...props }) => {
    const content = children?.toString().trim() || '';
    
    // If it's an empty code block, don't render anything
    if (content.length === 0) {
      return null;
    }

    return (
      <code 
        className="bg-slate-50/80 dark:bg-slate-800/30 px-2 py-1 rounded-md text-sm font-mono text-slate-700 dark:text-slate-300" 
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }) => (
    <pre 
      className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg overflow-x-auto mb-4 shadow-sm" 
      {...props}
    >
      {children}
    </pre>
  ),
  hr: () => (
    <hr className="my-8 border-t border-slate-200 dark:border-slate-700" />
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto mb-4">
      <table className="min-w-full border-collapse border border-slate-200 dark:border-slate-700">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-slate-200 dark:border-slate-700 px-4 py-2 bg-slate-50 dark:bg-slate-800 font-semibold text-left">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-slate-200 dark:border-slate-700 px-4 py-2">
      {children}
    </td>
  ),
};

export default function Markdown({ content, className = '' }: MarkdownProps) {
  return (
    <div className={`prose prose-slate max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
