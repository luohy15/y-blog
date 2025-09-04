import { LanguageCode } from './language';

export interface BlogPost {
  title: string;
  create_time: string;
  update_time: string;
  url: string;
  tags?: string[];
}

interface Frontmatter {
  created?: string;
  updated?: string;
  tags?: string[];
}

export async function getBlogPosts(language?: LanguageCode): Promise<BlogPost[]> {
  try {
    // Construct URL based on language
    const baseUrl = 'https://cdn.1u0hy.com';
    const url = language && language !== 'en' 
      ? `${baseUrl}/${language}/index.jsonl`
      : `${baseUrl}/index.jsonl`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/plain; charset=utf-8',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch blog posts');
    }
    
    const jsonlText = await response.text();
    const posts: BlogPost[] = [];
    
    // Parse JSONL format (each line is a separate JSON object)
    const lines = jsonlText.trim().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        try {
          const post = JSON.parse(line);
          posts.push(post);
        } catch (error) {
          console.error('Error parsing line:', line, error);
        }
      }
    }
    
    // Sort posts by creation date (newest first)
    return posts.sort((a, b) => new Date(b.create_time).getTime() - new Date(a.create_time).getTime());
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

function parseFrontmatter(content: string): { frontmatter: Frontmatter | null; content: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { frontmatter: null, content };
  }
  
  const frontmatterText = match[1];
  const markdownContent = match[2];
  
  try {
    const frontmatter: Frontmatter = {};
    
    // Parse YAML-like frontmatter
    const lines = frontmatterText.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) continue;
      
      if (trimmedLine.includes(':')) {
        const [key, ...valueParts] = trimmedLine.split(':');
        const value = valueParts.join(':').trim();
        
        if (key.trim() === 'created' || key.trim() === 'updated') {
          frontmatter[key.trim() as 'created' | 'updated'] = value;
        } else if (key.trim() === 'tags') {
          // Parse tags array [tag1, tag2, tag3]
          const tagsMatch = value.match(/\[(.*?)\]/);
          if (tagsMatch) {
            frontmatter.tags = tagsMatch[1]
              .split(',')
              .map(tag => tag.trim().replace(/['"]/g, ''))
              .filter(tag => tag.length > 0);
          }
        }
      }
    }
    
    return { frontmatter, content: markdownContent };
  } catch (error) {
    console.error('Error parsing frontmatter:', error);
    return { frontmatter: null, content };
  }
}

export async function getBlogPost(slug: string, language?: LanguageCode): Promise<{ post: BlogPost; content: string } | null> {
  try {
    // Special case for 'about' page - when slug is 'about' or empty
    if (!slug) {
      slug = 'about';
    }

    const posts = await getBlogPosts(language);
    
    // Find post by matching the filename in the URL with the slug
    const post = posts.find(p => {
      const postSlug = getSlugFromUrl(p.url);
      return postSlug === slug;
    });
    
    if (!post) {
      return null;
    }
    
    // Fetch the markdown content
    const response = await fetch(post.url, {
      headers: {
        'Accept': 'text/plain; charset=utf-8',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch post content');
    }
    
    const rawContent = await response.text();
    const { frontmatter, content } = parseFrontmatter(rawContent);
    
    // Create updated post with frontmatter data taking priority
    const updatedPost: BlogPost = {
      ...post,
      create_time: frontmatter?.created || post.create_time,
      update_time: frontmatter?.updated || post.update_time,
      tags: frontmatter?.tags || []
    };
    
    return { post: updatedPost, content };
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }
}

export function formatDate(dateString: string, language?: LanguageCode): string {
  const date = new Date(dateString);
  const languageMap: { [key in LanguageCode]?: string } = {
    'zhs': 'zh-Hans',
    'zht': 'zh-Hant',
  };
  const locale = language ? languageMap[language] || language : 'en-US';

  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function getSlugFromUrl(url: string): string {
  const urlParts = url.split('/');
  const filename = urlParts[urlParts.length - 1];
  return filename.replace('.md', '');
}
