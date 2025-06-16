import { getBlogPosts, getSlugFromUrl } from '@/lib/blog';
import PostPage from '@/components/PostPage';
import { LanguageCode } from '@/lib/language';
import type { Metadata } from 'next';
import { generateBlogMetadata } from '@/lib/metadata';

interface PageProps {
  params: Promise<{
    param: string;
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { param, slug } = await params;
  
  // Verify param is a valid language code
  const validLanguages: LanguageCode[] = ['ja', 'zhs', 'zht'];
  if (!validLanguages.includes(param as LanguageCode)) {
    return {
      title: "Huayi Luo"
    };
  }
  
  return generateBlogMetadata(slug, param as LanguageCode);
}

export async function generateStaticParams() {
  const params: { param: string; slug: string }[] = [];
  
  // Only generate for valid language codes
  const validLanguages: LanguageCode[] = ['ja', 'zhs', 'zht'];
  
  for (const language of validLanguages) {
    try {
      const posts = await getBlogPosts(language);
      
      for (const post of posts) {
        const slug = getSlugFromUrl(post.url);
        params.push({ 
          param: language,
          slug: slug 
        });
      }
    } catch (error) {
      console.warn(`Error fetching posts for language ${language}:`, error);
    }
  }
  
  return params;
}

export default async function LanguageSlugPage({ params }: PageProps) {
  const { param, slug } = await params;
  
  // Verify param is a valid language code
  const validLanguages: LanguageCode[] = ['ja', 'zhs', 'zht'];
  if (!validLanguages.includes(param as LanguageCode)) {
    // This shouldn't happen due to generateStaticParams, but handle gracefully
    return <div>Invalid language code</div>;
  }
  
  return <PostPage slug={slug} lang={param as LanguageCode} showToc={true} />;
}
