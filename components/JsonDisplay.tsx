'use client';

import React, { useState, useEffect } from 'react';
import { JsonValue, fetchJsonData } from '@/lib/json-utils';
import JsonContent from './JsonContent';
import { AlertCircle, Loader2 } from 'lucide-react';

interface JsonDisplayProps {
  url: string;
  className?: string;
}

export default function JsonDisplay({ url, className = '' }: JsonDisplayProps) {
  const [data, setData] = useState<JsonValue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadJsonData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!url) {
          throw new Error('No URL provided');
        }

        // Validate URL format
        try {
          const urlObj = new URL(url);
          if (!urlObj.protocol.startsWith('http')) {
            throw new Error('URL must use HTTP or HTTPS protocol');
          }
        } catch {
          throw new Error('Invalid URL format');
        }

        const jsonData = await fetchJsonData(url);
        setData(jsonData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load JSON data';
        setError(errorMessage);
        console.error('JsonDisplay error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadJsonData();
  }, [url]);


  if (loading) {
    return (
      <div className={`json-display ${className}`}>
        <div className="flex items-center justify-center py-12 space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600 dark:text-purple-400" />
          <span className="text-slate-600 dark:text-slate-400">
            Loading JSON from {url}...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`json-display ${className}`}>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-900 dark:text-red-200 font-semibold mb-1">
                Failed to load JSON
              </h3>
              <p className="text-red-700 dark:text-red-300 text-sm mb-2">
                {error}
              </p>
              <p className="text-red-600 dark:text-red-400 text-xs font-mono">
                URL: {url}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`json-display ${className}`}>
        <div className="text-slate-500 dark:text-slate-400 text-center py-8">
          No JSON data received
        </div>
      </div>
    );
  }

  return (
    <div className={`json-display ${className}`}>
      {/* JSON Metadata */}
      <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-purple-600 dark:text-purple-400 text-lg">📊</span>
          <h3 className="text-purple-900 dark:text-purple-200 font-semibold">
            JSON Data Source
          </h3>
        </div>
        <p className="text-purple-700 dark:text-purple-300 text-sm font-mono break-all">
          {url}
        </p>
        <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
          <span>
            {Array.isArray(data) ? `Array (${data.length} items)` : `Object (${Object.keys(data as Record<string, JsonValue>).length} keys)`}
          </span>
        </div>
      </div>

      {/* JSON Content */}
      <JsonContent data={data} className="mt-4" />
    </div>
  );
}
