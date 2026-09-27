// Generates the Markdown twin of every human-facing page into dist/, at
// build time, after `vite build` has produced dist/. Run with:
//   node --experimental-strip-types scripts/generate-markdown.ts
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { languages, defaultLanguage, type LanguageCode } from '../src/lib/language.ts';
import {
  fetchBlogPostsOrThrow,
  getPostContentUrl,
  getSlugFromUrl,
  applyFrontmatterOverrides,
  parseFrontmatter,
  type BlogPost,
} from '../src/lib/blog.ts';
import { collectTags, articlesForTag } from '../src/lib/tags.ts';
import {
  articleTwinPaths,
  assertNonEmptyIndex,
  rewriteLinks,
  renderArticle,
  renderWriting,
  renderTags,
  renderTagListing,
  renderLlmsTxt,
  renderNotFound,
  tagTwinPaths,
} from '../src/lib/markdown.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');

function readRedirects(): Record<string, string> {
  const path = join(ROOT, 'src/redirects.json');
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch (error) {
    console.warn('Could not parse src/redirects.json, using empty redirects:', error);
    return {};
  }
}

function write(relativePath: string, content: string): void {
  const absolute = join(DIST, relativePath.replace(/^\//, ''));
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, content);
}

async function fetchArticle(post: BlogPost): Promise<{ post: BlogPost; content: string }> {
  const response = await fetch(getPostContentUrl(post), {
    headers: { Accept: 'text/plain; charset=utf-8' },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${post.url}: ${response.status}`);
  }
  const raw = await response.text();
  const { frontmatter, content } = parseFrontmatter(raw);
  return { post: applyFrontmatterOverrides(post, frontmatter), content };
}

async function generateForLanguage(
  language: LanguageCode,
  redirects: Record<string, string>,
): Promise<BlogPost[]> {
  const rawPosts = await fetchBlogPostsOrThrow(language === defaultLanguage ? undefined : language);
  assertNonEmptyIndex(rawPosts, language);
  const resolved: { post: BlogPost; content: string }[] = [];

  for (const rawPost of rawPosts) {
    resolved.push(await fetchArticle(rawPost));
  }

  const posts = resolved.map((r) => r.post);

  for (const { post, content } of resolved) {
    const rewritten = rewriteLinks(content, { posts, language, sourceUrl: post.url });
    for (const routePath of articleTwinPaths(post, language, redirects)) {
      const canonicalUrl = `https://luohy15.com${routePath}`;
      write(`${routePath}.md`, renderArticle(post, rewritten, canonicalUrl));
    }
  }

  const aboutPost = resolved.find((r) => getSlugFromUrl(r.post.url) === 'about');
  if (aboutPost) {
    const rewritten = rewriteLinks(aboutPost.content, { posts, language, sourceUrl: aboutPost.post.url });
    const homeUrl = language === defaultLanguage ? 'https://luohy15.com/' : `https://luohy15.com/${language}`;
    const homeArticle = renderArticle(aboutPost.post, rewritten, homeUrl);
    if (language === defaultLanguage) {
      write('/index.md', homeArticle);
    } else {
      write(`/${language}.md`, homeArticle);
      write(`/${language}/index.md`, homeArticle);
    }
  }

  const writingPath = language === defaultLanguage ? '/writing.md' : `/${language}/writing.md`;
  write(writingPath, renderWriting(posts, language));

  const tags = collectTags(posts);
  const tagsPath = language === defaultLanguage ? '/tags.md' : `/${language}/tags.md`;
  write(tagsPath, renderTags(tags, posts, language));

  for (const tag of tags) {
    const listing = renderTagListing(tag, articlesForTag(posts, tag), language);
    for (const routePath of tagTwinPaths(tag, language)) {
      write(`${routePath}.md`, listing);
    }
  }

  return posts;
}

async function main() {
  const redirects = readRedirects();
  const languageCodes = Object.keys(languages) as LanguageCode[];
  let enPosts: BlogPost[] = [];

  for (const language of languageCodes) {
    const posts = await generateForLanguage(language, redirects);
    if (language === defaultLanguage) {
      enPosts = posts;
    }
  }

  write('/llms.txt', renderLlmsTxt(enPosts));
  write('/404.md', renderNotFound());

  console.log('Markdown twins generated.');
}

main().catch((error) => {
  console.error('Failed to generate Markdown twins:', error);
  process.exit(1);
});
