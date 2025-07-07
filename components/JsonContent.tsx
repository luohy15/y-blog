'use client';

import React, { useState, useMemo } from 'react';
import { JsonNode, JsonValue, formatJsonValue, generateJsonSlug } from '@/lib/json-utils';
import { ChevronRight, ChevronDown, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JsonContentProps {
  data: JsonValue;
  className?: string;
}

interface JsonNodeRendererProps {
  node: JsonNode;
  level: number;
  expandedNodes: Set<string>;
  onToggleExpand: (nodeId: string) => void;
}

function JsonNodeRenderer({ node, level, expandedNodes, onToggleExpand }: JsonNodeRendererProps) {
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.type === 'object' || node.type === 'array';
  const indent = level * 20;

  const copyToClipboard = async (value: JsonValue) => {
    try {
      const text = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const renderValue = () => {
    const formattedValue = formatJsonValue(node.value, node.type);
    
    switch (node.type) {
      case 'string':
        return <span className="text-green-600 dark:text-green-400">{formattedValue}</span>;
      case 'number':
        return <span className="text-blue-600 dark:text-blue-400">{formattedValue}</span>;
      case 'boolean':
        return <span className="text-orange-600 dark:text-orange-400">{formattedValue}</span>;
      case 'null':
        return <span className="text-gray-500 dark:text-gray-400">{formattedValue}</span>;
      case 'array':
      case 'object':
        return <span className="text-purple-600 dark:text-purple-400">{formattedValue}</span>;
      default:
        return <span className="text-slate-600 dark:text-slate-400">{formattedValue}</span>;
    }
  };

  const shouldShowAnchor = level <= 2;

  return (
    <div className="json-node">
      {/* Main node line */}
      <div 
        id={shouldShowAnchor ? node.id : undefined}
        className={`flex items-center py-1 px-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
          shouldShowAnchor ? 'scroll-mt-20' : ''
        }`}
        style={{ paddingLeft: `${indent + 8}px` }}
      >
        {/* Expand/collapse button */}
        {hasChildren && (
          <button
            onClick={() => onToggleExpand(node.id)}
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors mr-2"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        )}
        
        {/* Spacer for non-expandable items */}
        {!hasChildren && <div className="w-5 mr-2" />}
        
        {/* Key name */}
        <span className="font-mono text-sm text-slate-700 dark:text-slate-300 mr-2">
          &quot;{node.key}&quot;:
        </span>
        
        {/* Value */}
        <span className="font-mono text-sm flex-1">
          {renderValue()}
        </span>
        
        {/* Copy button */}
        <button
          onClick={() => copyToClipboard(node.value)}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors ml-2 opacity-0 group-hover:opacity-100"
          title="Copy value"
        >
          <Copy className="w-3 h-3" />
        </button>
      </div>
      
      {/* Children - recursively render if expanded */}
      {hasChildren && isExpanded && (
        <div className="json-children">
          {Array.isArray(node.value) ? (
            (node.value as JsonValue[]).map((item, index) => {
              const childPath = [...node.path, `[${index}]`];
              const childId = generateJsonSlug(childPath);
              const childNode: JsonNode = {
                key: `[${index}]`,
                value: item,
                type: item === null ? 'null' : Array.isArray(item) ? 'array' : typeof item as JsonNode['type'],
                path: childPath,
                id: childId
              };
              
              return (
                <JsonNodeRenderer
                  key={childId}
                  node={childNode}
                  level={level + 1}
                  expandedNodes={expandedNodes}
                  onToggleExpand={onToggleExpand}
                />
              );
            })
          ) : (
            Object.entries(node.value as Record<string, JsonValue>).map(([key, value]) => {
              const childPath = [...node.path, key];
              const childId = generateJsonSlug(childPath);
              const childNode: JsonNode = {
                key,
                value,
                type: value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value as JsonNode['type'],
                path: childPath,
                id: childId
              };
              
              return (
                <JsonNodeRenderer
                  key={childId}
                  node={childNode}
                  level={level + 1}
                  expandedNodes={expandedNodes}
                  onToggleExpand={onToggleExpand}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function JsonContent({ data, className = '' }: JsonContentProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Convert data to tree structure
  const rootNodes = useMemo(() => {
    if (!data || typeof data !== 'object') return [];
    
    if (Array.isArray(data)) {
      return data.map((item, index) => {
        const path = [`[${index}]`];
        const id = generateJsonSlug(path);
        return {
          key: `[${index}]`,
          value: item,
          type: item === null ? 'null' : Array.isArray(item) ? 'array' : typeof item as JsonNode['type'],
          path,
          id
        } as JsonNode;
      });
    } else {
      return Object.entries(data as Record<string, JsonValue>).map(([key, value]) => {
        const path = [key];
        const id = generateJsonSlug(path);
        return {
          key,
          value,
          type: value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value as JsonNode['type'],
          path,
          id
        } as JsonNode;
      });
    }
  }, [data]);

  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    const allNodeIds = new Set<string>();
    
    const collectNodeIds = (nodes: JsonNode[]) => {
      nodes.forEach(node => {
        if (node.type === 'object' || node.type === 'array') {
          allNodeIds.add(node.id);
        }
      });
    };
    
    collectNodeIds(rootNodes);
    setExpandedNodes(allNodeIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const copyAllJson = async () => {
    try {
      const text = JSON.stringify(data, null, 2);
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy JSON:', error);
    }
  };

  if (!data) {
    return (
      <div className={`json-content ${className}`}>
        <div className="text-slate-500 dark:text-slate-400 text-center py-8">
          No JSON data to display
        </div>
      </div>
    );
  }

  return (
    <div className={`json-content ${className}`}>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
        <Button
          variant="outline"
          size="sm"
          onClick={expandAll}
          className="text-xs"
        >
          Expand All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={collapseAll}
          className="text-xs"
        >
          Collapse All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={copyAllJson}
          className="text-xs"
        >
          <Copy className="w-3 h-3 mr-1" />
          Copy JSON
        </Button>
      </div>

      {/* JSON Tree */}
      <div className="json-tree bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <div className="p-4 font-mono text-sm group">
          {rootNodes.map(node => (
            <JsonNodeRenderer
              key={node.id}
              node={node}
              level={0}
              expandedNodes={expandedNodes}
              onToggleExpand={toggleNodeExpansion}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
