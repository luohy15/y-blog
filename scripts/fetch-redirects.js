import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function fetchRedirects() {
  try {
    const response = await fetch('https://cdn.luohy15.com/blog/redirects.json');

    if (!response.ok) {
      console.warn('Failed to fetch redirects, using empty redirects');
      return {};
    }

    const redirects = await response.json();
    const newContent = JSON.stringify(redirects, null, 2);

    // Write to src directory so it can be imported by worker
    const outputPath = join(__dirname, '../src/redirects.json');

    // Only write if content has changed to avoid triggering unnecessary rebuilds
    let shouldWrite = true;
    if (existsSync(outputPath)) {
      const existingContent = readFileSync(outputPath, 'utf-8');
      shouldWrite = existingContent !== newContent;
    }

    if (shouldWrite) {
      writeFileSync(outputPath, newContent);
      console.log('✓ Redirects fetched and saved');
    } else {
      console.log('✓ Redirects unchanged, skipping write');
    }
  } catch (error) {
    console.warn('Error fetching redirects:', error.message);
    console.warn('Using empty redirects');

    // Write empty redirects as fallback
    const outputPath = join(__dirname, '../src/redirects.json');
    const emptyContent = '{}';

    // Only write if file doesn't exist or content differs
    if (!existsSync(outputPath) || readFileSync(outputPath, 'utf-8') !== emptyContent) {
      writeFileSync(outputPath, emptyContent);
    }
  }
}

fetchRedirects();
