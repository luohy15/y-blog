---
title: Agent-Friendly Markdown Endpoints
type: prd
project: y-blog
feature: agent-markdown
status: active
---

# Agent-Friendly Markdown Endpoints

Durable feature home for serving the blog as plain Markdown to agents and other
non-browser clients. Requirements come from Roy's request in todo 3710
(2026-09-27). Delivery may touch both `y-blog` (site, hosting) and
`y-blog-content` (published sources), but this PRD is the single requirement
source for both.

## Problem Statement

The blog at luohy15.com works for human readers, but it is a client-rendered
single-page app. An agent that fetches any page URL receives an HTML shell with
no article text; the real content only appears after JavaScript runs and pulls
Markdown from the CDN. Agents therefore cannot read an article, list the
writing, or browse tags without knowing the private CDN layout. Roy wants agents
to browse the whole site as easily as a person does.

## Solution

Every human-facing page has a Markdown twin, and the site advertises how to find
them:

- **Append `.md` to any page URL** to get that page as plain Markdown. This is
  the primary, user-facing contract Roy asked for: an agent that knows a page URL
  knows its Markdown URL without any lookup.
- **A site-level index at `/llms.txt`** lists the site's pages and articles with
  their Markdown URLs, so an agent that only knows the domain can discover
  everything in one fetch.
- **HTML pages point to their twin** through a `<link rel="alternate"
  type="text/markdown">` in the document head, so a tool that did fetch the HTML
  can find the Markdown version.
- Markdown twins of listing pages (Writing, Tags, a tag's listing) link onward
  with Markdown URLs, so an agent can crawl the site while staying in Markdown.

Human readers see no change.

## User Stories

### Article access

1. As an agent, I want to fetch `<article URL>.md` and receive the article's
   Markdown, so that I can read it without executing JavaScript.
2. As an agent, I want the article Markdown to include the title, the created
   and updated dates, and the tags, so that I have the same context a human sees
   in the article header.
3. As an agent, I want the article body to be the author's Markdown source, not
   HTML converted back to Markdown, so that headings, code blocks, tables, and
   math survive intact.
4. As an agent, I want image and relative links inside the Markdown to be
   absolute URLs, so that they resolve when the Markdown is read outside the
   site.
5. As an agent, I want links between articles inside the Markdown to point to
   Markdown URLs where the target is on this site, so that I can follow them
   without switching to HTML.
6. As an agent, I want `.md` to work on every URL form the site accepts for an
   article (the canonical slug URL, the language-prefixed URL, and the legacy
   dated URL), so that any link I find in the wild has a Markdown twin.
7. As an agent, I want a renamed or retired article slug with `.md` appended to
   resolve to the current article's Markdown (by redirect or directly), so that
   old links keep working the same way they do for humans.

### Languages

8. As an agent, I want `.md` to work for every language the site serves (English
   default and each prefixed language such as `/zhs/...`, `/zht/...`, `/ja/...`),
   so that I can read translated articles.
9. As an agent, I want each language's Markdown to contain that language's
   content, so that the Markdown matches what a human sees at the same URL.
10. As an agent, I want an article that has no translation in a language to
    behave the same way the HTML page does for that language, so that the two
    representations never disagree about what exists.

### Index and listing pages

11. As an agent, I want the home page (`/` and each language root) with `.md`
    to return the About content, since that is what the home page shows humans.
12. As an agent, I want the Writing page with `.md` to return a Markdown list of
    all articles in that language, newest first, with title, date, and Markdown
    link for each, so that I can enumerate the writing.
13. As an agent, I want the Tags page with `.md` to return the list of tags with
    article counts and Markdown links to each tag's listing, so that I can
    browse by topic.
14. As an agent, I want a tag's listing URL with `.md` to return that tag's
    articles as a Markdown list, so that I can read everything on one topic.
15. As an agent, I want the root URL form `/index.md` (or an equivalent the
    plan documents) to work for the home page, since `/.md` is not a natural
    URL, so that the home page has a usable Markdown twin.

### Discovery

16. As an agent that only knows the domain, I want `/llms.txt` to describe the
    site in one short paragraph and list the top-level pages and every article
    with its Markdown URL, so that I can discover the whole site in one request.
17. As an agent, I want `/llms.txt` to mention how to reach other languages, so
    that I can find translated content without guessing URL rules.
18. As an agent that fetched an HTML page, I want a `rel="alternate"
    type="text/markdown"` link in the head pointing to that page's Markdown
    twin, so that I can switch representation without knowing the `.md` rule.
19. As Roy, I want the `.md` convention to be discoverable from `/llms.txt`
    itself, so that the index teaches agents the URL rule rather than just
    listing links.

### Protocol correctness

20. As an agent, I want Markdown responses served with
    `Content-Type: text/markdown; charset=utf-8`, so that I can trust the
    format and decode non-ASCII text correctly.
21. As an agent, I want `/llms.txt` served as UTF-8 plain text or Markdown, so
    that it decodes correctly.
22. As an agent, I want a `.md` URL for a page that does not exist to return a
    real 404 status, not the SPA HTML shell with 200, so that I can tell missing
    content from real content.
23. As an agent, I want Markdown responses to be cacheable but not stale beyond
    the site's normal content freshness window, so that I see updated articles
    about as soon as humans do.

### Freshness and maintenance

24. As Roy, I want publishing or editing an article through the existing blog
    workflow to update its Markdown twin and its `/llms.txt` entry without any
    extra manual step, so that the agent view never drifts from the human view.
25. As Roy, I want the article list used for Markdown listings and `/llms.txt`
    to come from the same authoritative index the site already uses, so that
    there is one source of truth for what is published.
26. As Roy, I want adding a new language or a new tag to need no change to the
    Markdown feature, so that it keeps covering the whole site as content grows.
27. As a human reader, I want the existing pages, URLs, and loading behaviour
    to stay unchanged, so that the agent feature costs me nothing.

## Implementation Decisions

- **`.md` suffix URLs are required.** They are the contract Roy asked for and
  the one every other mechanism points to.
- **`/llms.txt` is required** as the site-level discovery index, following the
  common `llms.txt` convention (title, short summary, sections of links). An
  expanded `/llms-full.txt` with full article bodies is optional; the plan
  decides whether its cost is worth it.
- **`<link rel="alternate" type="text/markdown">` is required** on HTML pages.
  Because pages are client-rendered, it is acceptable for this link to be set at
  runtime as long as it reflects the current route; the plan may choose a static
  or server-side form instead.
- **`Accept: text/markdown` content negotiation is optional.** It is useful
  when the hosting layer can do it cheaply, but it is not part of the required
  contract; the plan evaluates it against the hosting setup.
- **Where Markdown is produced is a planning decision**: build-time generation,
  publication from the content repository, or edge logic in front of the static
  host are all acceptable, provided the stories above hold, especially
  freshness (24), a single source of truth (25), correct status and content
  type (20, 22), and no regressions for humans (27).
- **Listing Markdown is generated, article Markdown is sourced.** Article bodies
  come from the published Markdown source (with front matter turned into the
  readable header of story 2 or kept as front matter; the plan picks one and
  documents it). Home, Writing, Tags, and tag listings are generated from the
  published index.
- **URL semantics mirror the HTML routes.** Redirects, language resolution, and
  tag URL rules for `.md` URLs follow the same rules as the HTML routes, so
  there is one routing truth rather than a parallel scheme.

## Testing Decisions

- Test external behaviour over HTTP: for a sample of articles in each language,
  request the `.md` URL and assert status 200, the Markdown content type, and a
  body that contains the article's title and a known heading.
- Cover each URL form in stories 6 and 7: canonical slug, language-prefixed,
  legacy dated, and a redirected slug.
- Cover listing twins: home, Writing, Tags, one tag listing, each in English and
  one prefixed language.
- Assert that an unknown `.md` path returns 404.
- Assert that `/llms.txt` lists every article in the published index and that
  each listed URL returns 200.
- Assert that the HTML head of an article carries the alternate link to the
  correct `.md` URL.
- Pure helpers (URL mapping from page to Markdown URL, listing generation) get
  unit tests; route and redirect rules reuse the helpers the site already tests.
- Per the cross-project default, tests stay local-only unless this repository
  decides otherwise.

## Out of Scope

- Changing the human-facing UI, visual design, or HTML URL scheme.
- Server-side rendering or prerendering the HTML for search engines or agents;
  this feature adds a Markdown representation, it does not replace the SPA.
- A search API, JSON API, or MCP server for the blog.
- RSS or Atom feeds.
- Markdown twins for pages that do not exist on the site today.
- Rewriting or restructuring existing article content beyond link
  normalisation in story 4 and 5.
- Tag navigation behaviour itself, owned by `tag-navigation`; this PRD only
  requires Markdown twins of the pages that feature defines.

## Delivery Records

| Todo | Outcome | Design | Plan | Decisions | Review | Status |
|------|---------|--------|------|-----------|--------|--------|
| 3710 | Markdown twins, `/llms.txt`, alternate links | - | `pages/plan-3710-agent-markdown.md` | - | `pages/review-3710-agent-markdown.md` | reviewed, publication authorization pending |
