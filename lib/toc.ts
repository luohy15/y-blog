export interface TocItem {
  id: string;
  text: string;
  level: 1 | 2;
  children?: TocItem[];
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

export function extractTocFromMarkdown(content: string): TocItem[] {
  const lines = content.split('\n');
  const tocItems: TocItem[] = [];
  let currentH1: TocItem | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Match h1 headings (# Title)
    const h1Match = trimmedLine.match(/^#\s+(.+)$/);
    if (h1Match) {
      const text = h1Match[1].trim();
      const id = generateSlug(text);
      currentH1 = {
        id,
        text,
        level: 1,
        children: []
      };
      tocItems.push(currentH1);
      continue;
    }

    // Match h2 headings (## Title)
    const h2Match = trimmedLine.match(/^##\s+(.+)$/);
    if (h2Match) {
      const text = h2Match[1].trim();
      const id = generateSlug(text);
      const h2Item: TocItem = {
        id,
        text,
        level: 2
      };

      if (currentH1) {
        currentH1.children!.push(h2Item);
      } else {
        // If no h1 parent, treat as top-level
        tocItems.push(h2Item);
      }
    }
  }

  return tocItems;
}
