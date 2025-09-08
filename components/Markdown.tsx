'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Components } from 'react-markdown';
import { generateSlug } from '@/lib/toc';
import JsonDisplay from './JsonDisplay';

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
  a: ({ href, children, onClick, ...props }) => {
    const isExternal = href && (href.startsWith('http') || href.startsWith('https'));

    // Handle onclick string conversion
    const handleClick = onClick && typeof onClick === 'string'
      ? () => {
          try {
            // Execute the onclick string as code (for gtag calls etc.)
            eval(onClick);
          } catch (error) {
            console.error('Error executing onclick:', error);
          }
        }
      : onClick;

    return (
      <a
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        onClick={handleClick}
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
  div: ({ className, ...props }) => {
    // Check if this is a json-display placeholder
    if (className?.includes('json-display-placeholder')) {
      const url = (props as Record<string, unknown>)['data-json-display'] as string;
      if (url) {
        return <JsonDisplay url={url} className="my-6" />;
      }
    }
    // Regular div
    return <div className={className} {...props} />;
  },
};

// Function to parse Hugo shortcodes like {{< rawhtml >}} and {{< json-display >}}
function parseShortcodes(content: string): string {
  let processedContent = content;
  
  // Replace {{< rawhtml >}} shortcodes with the HTML content inside
  const rawhtmlRegex = /\{\{<\s*rawhtml\s*>\}\}([\s\S]*?)\{\{<\s*\/rawhtml\s*>\}\}/g;
  processedContent = processedContent.replace(rawhtmlRegex, (match, htmlContent) => {
    // Return the HTML content with proper spacing
    return htmlContent.trim();
  });
  
  // Replace {{< json-display >}}URL{{< /json-display >}} with special HTML element
  const jsonDisplayRegex = /\{\{<\s*json-display\s*>\}\}([\s\S]*?)\{\{<\s*\/json-display\s*>\}\}/g;
  processedContent = processedContent.replace(jsonDisplayRegex, (match, url) => {
    const cleanUrl = url.trim();
    return `<div data-json-display="${cleanUrl}" class="json-display-placeholder"></div>`;
  });
  
  return processedContent;
}

export default function Markdown({ content, className = '' }: MarkdownProps) {
  // Preprocess content to handle Hugo shortcodes
  const processedContent = parseShortcodes(content);

  // Add error boundary and validation for content
  if (!processedContent || typeof processedContent !== 'string') {
    console.error('Invalid markdown content:', processedContent);
    return <div className="text-red-500">Error: Invalid content</div>;
  }

  return (
    <div className={`prose prose-slate max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={markdownComponents}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
