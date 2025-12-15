import { Hono } from 'hono';
import redirects from './redirects.json';

interface Env {
  ASSETS: {
    fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  };
}

// Create the main Hono app
const app = new Hono<{
  Bindings: Env;
}>();

// Handle redirects (loaded at build time, zero runtime overhead)
app.all('*', async (c) => {
  const url = new URL(c.req.url);
  const pathname = url.pathname;

  // Extract the last segment (slug) from the path
  const segments = pathname.split('/').filter(Boolean);
  const slug = segments[segments.length - 1];

  // Check if this slug needs to be redirected
  const newSlug = redirects[slug as keyof typeof redirects];
  if (newSlug) {
    // Replace the last segment with the new slug
    segments[segments.length - 1] = newSlug;
    const newPath = '/' + segments.join('/');
    return c.redirect(newPath, 301);
  }

  // Convert Hono request to standard Request for ASSETS.fetch
  const request = new Request(c.req.url, {
    method: c.req.method,
    headers: c.req.raw.headers,
    body: c.req.raw.body
  });
  return c.env.ASSETS.fetch(request);
});

// Export the fetch handler
const handler = {
  fetch: app.fetch,
};

export default handler;
