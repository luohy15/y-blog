import { Hono } from 'hono';

interface Env {
  ASSETS: {
    fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  };
}

// Create the main Hono app
const app = new Hono<{ 
  Bindings: Env; 
}>();

// For all routes, serve static assets
app.all('*', async (c) => {
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
