import PostPage from '@/components/PostPage';
import { LanguageCode } from '@/lib/language';
import { getBlogPost } from '@/lib/blog';
import type { Metadata } from 'next';
import { generateBlogMetadata } from '@/lib/metadata';

interface PageProps {
  params: Promise<{
    param: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { param } = await params;
  
  // Check if param is a language code
  const validLanguages: LanguageCode[] = ['ja', 'zhs', 'zht'];
  const isLanguage = validLanguages.includes(param as LanguageCode);
  
  if (isLanguage) {
    // About page for the language
    return generateBlogMetadata('about', param as LanguageCode, "About - Huayi Luo");
  } else {
    // Blog post slug
    return generateBlogMetadata(param);
  }
}

export default async function ParamPage({ params }: PageProps) {
  const { param } = await params;
  
  // Check if param is a language code
  const validLanguages: LanguageCode[] = ['ja', 'zhs', 'zht'];
  const isLanguage = validLanguages.includes(param as LanguageCode);
  
  if (isLanguage) {
    // Show about page for the language
    return <PostPage slug="about" lang={param as LanguageCode} showTime={false} showToc={false} />;
  } else {
    // Treat as blog post slug
    return <PostPage slug={param} showToc={true} />;
  }
}

export async function generateStaticParams() {
  const params: { param: string }[] = [];
  
  // Add language codes
  const languages: LanguageCode[] = ['ja', 'zhs', 'zht'];
  for (const language of languages) {
    try {
      const aboutPost = await getBlogPost('about', language);
      if (aboutPost) {
        params.push({ param: language });
      }
    } catch {
      console.warn(`About content not found for language: ${language}`);
    }
  }
  
  // Add blog post slugs (import from existing slug logic)
  const { getBlogPosts, getSlugFromUrl } = await import('@/lib/blog');
  const posts = await getBlogPosts();
  
  for (const post of posts) {
    const slug = getSlugFromUrl(post.url);
    // Only add if it's not a language code to avoid conflicts
    if (!languages.includes(slug as LanguageCode)) {
      params.push({ param: slug });
    }
  }
  
  return params;
}
