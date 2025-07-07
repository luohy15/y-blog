export interface JsonTocItem {
  id: string;
  text: string;
  level: 1 | 2;
  path: string[];
}

export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];

export interface JsonNode {
  key: string;
  value: JsonValue;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  path: string[];
  id: string;
  children?: JsonNode[];
}

export function generateJsonSlug(path: string[]): string {
  return path.join('-').toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

export function extractJsonToc(data: JsonValue, maxDepth: number = 2): JsonTocItem[] {
  const tocItems: JsonTocItem[] = [];
  
  function traverse(obj: JsonValue, currentPath: string[] = [], currentLevel: number = 1) {
    if (currentLevel > maxDepth || obj === null || typeof obj !== 'object') {
      return;
    }
    
    Object.keys(obj as JsonObject).forEach(key => {
      const newPath = [...currentPath, key];
      const id = generateJsonSlug(newPath);
      
      tocItems.push({
        id,
        text: key,
        level: currentLevel as 1 | 2,
        path: newPath
      });
      
      if (currentLevel < maxDepth && (obj as JsonObject)[key] && typeof (obj as JsonObject)[key] === 'object') {
        traverse((obj as JsonObject)[key], newPath, currentLevel + 1);
      }
    });
  }
  
  if (data && typeof data === 'object') {
    traverse(data);
  }
  
  return tocItems;
}

export function flattenJsonToNodes(data: JsonValue, path: string[] = []): JsonNode[] {
  const nodes: JsonNode[] = [];
  
  function getValueType(value: JsonValue): JsonNode['type'] {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value as JsonNode['type'];
  }
  
  function traverse(obj: JsonValue, currentPath: string[] = []) {
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      Object.keys(obj as JsonObject).forEach(key => {
        const value = (obj as JsonObject)[key];
        const newPath = [...currentPath, key];
        const id = generateJsonSlug(newPath);
        
        const node: JsonNode = {
          key,
          value,
          type: getValueType(value),
          path: newPath,
          id
        };
        
        if (value && typeof value === 'object') {
          node.children = [];
          traverse(value, newPath);
        }
        
        nodes.push(node);
      });
    } else if (Array.isArray(obj)) {
      (obj as JsonArray).forEach((item, index) => {
        const key = `[${index}]`;
        const newPath = [...currentPath, key];
        const id = generateJsonSlug(newPath);
        
        const node: JsonNode = {
          key,
          value: item,
          type: getValueType(item),
          path: newPath,
          id
        };
        
        if (item && typeof item === 'object') {
          node.children = [];
          traverse(item, newPath);
        }
        
        nodes.push(node);
      });
    }
  }
  
  traverse(data, path);
  return nodes;
}

export async function fetchJsonData(url: string): Promise<JsonValue> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json() as JsonValue;
    return data;
  } catch (error) {
    console.error('Failed to fetch JSON:', error);
    throw error;
  }
}

export function formatJsonValue(value: JsonValue, type: JsonNode['type']): string {
  switch (type) {
    case 'string':
      return `"${value}"`;
    case 'number':
    case 'boolean':
      return String(value);
    case 'null':
      return 'null';
    case 'array':
      return `Array(${(value as JsonArray).length})`;
    case 'object':
      return `Object(${Object.keys(value as JsonObject).length})`;
    default:
      return String(value);
  }
}
