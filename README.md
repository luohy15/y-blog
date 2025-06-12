# Y-Blog

This is a [Next.js](https://nextjs.org) project configured for deployment to Cloudflare Workers as a static site.

## Getting Started

First, install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment to Cloudflare Workers

This project is configured to deploy as a static site to Cloudflare Workers using Hono.

### Prerequisites

1. Install Wrangler CLI globally (optional, since it's included as dev dependency):
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   npx wrangler auth login
   ```

### Deploy

1. Build the static site:
   ```bash
   npm run build
   ```

2. Deploy to Cloudflare Workers:
   ```bash
   npm run deploy
   ```

3. Preview deployment (dry run):
   ```bash
   npm run preview
   ```

### Configuration

- **wrangler.toml**: Cloudflare Workers configuration
- **src/worker.ts**: Hono-based worker script for serving static assets
- **next.config.ts**: Configured for static export

### Custom Domain

To use a custom domain, uncomment and configure the routes section in `wrangler.toml`:

```toml
routes = [
  { pattern = "yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

## Project Structure

- Static assets are built to `/out` directory
- Worker script serves assets with appropriate caching headers
- CORS enabled for API compatibility
