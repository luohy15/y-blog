import type { Metadata } from 'next';
import { getBlogPost } from './blog';
import { LanguageCode } from './language';
import { getTranslation } from './translations';

export async function generateBlogMetadata(
  slug: string, 
  language?: LanguageCode,
  fallbackTitle?: string
): Promise<Metadata> {
  try {
    const result = await getBlogPost(slug, language);
    if (result) {
      return {
        title: `${result.post.title} - Huayi Luo`
      };
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
  }
  
  // Use provided fallback or default
  return {
    title: fallbackTitle || "Huayi Luo"
  };
}

export function generateWritingMetadata(language?: LanguageCode): Metadata {
  const writingText = language ? getTranslation(language, 'nav.writing') : 'Writing';
  
  return {
    title: `${writingText} - Huayi Luo`
  };
}
