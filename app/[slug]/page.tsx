import { getBlogPosts, getSlugFromUrl } from '@/lib/blog';
import PostPage from '@/components/PostPage';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  
  return posts.map((post) => ({
    slug: getSlugFromUrl(post.url),
  }));
}

export default async function SlugPage({ params }: PageProps) {
  const { slug } = await params;
  return <PostPage slug={slug} showToc={true} />;
}
