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
(2026-09-27). Delivery touches both `y-blog` (site, edge routing) and
`y-blog-content` (published sources and generated navigation), but this PRD is
the single requirement source for both.

## Problem Statement

The blog at luohy15.com works for human readers, but it is a client-rendered
single-page app. An agent that fetches any page URL receives an HTML shell with
no article text; the real content only appears after JavaScript runs and pulls
Markdown from the CDN. Agents therefore cannot read an article, list the
writing, or browse tags without knowing the private CDN layout. Roy wants agents
to browse the whole site as easily as a person does.

## Solution

Every human-facing page has a Markdown twin on the same host, and the site
advertises how to find them:

- **Append `.md` to any page URL** to get that page as plain Markdown. This is
  the primary, user-facing contract Roy asked for: an agent that knows a page URL
  knows its Markdown URL without any lookup.
- **Articles and About are served verbatim.** The Markdown an agent receives is
  exactly the source object the content pipeline already publishes, the same
  bytes the SPA renders from. Nothing is injected, stripped, or rewritten.
- **Navigation is generated at content publish.** The Writing, Tags, and
  per-tag listings, plus `/llms.txt`, are generated from the published post
  index by the content repository's publish pipeline and published next to the
  articles.
- **A site-level index at `/llms.txt`** explains the `.md` rule and lists the
  site's pages and articles with their Markdown URLs, so an agent that only knows
  the domain can discover everything in one fetch.
- **HTML pages point to their twin** through a `<link rel="alternate"
  type="text/markdown">` in the document head.
- The site host routes `.md` and `/llms.txt` requests to those published
  objects. There is no article mirror, no runtime service, and no site rebuild
  when content changes.

Human readers see no change in pages, URLs, or loading behaviour.

## User Stories

### Article access

1. As an agent, I want to fetch `<article URL>.md` and receive the article's
   Markdown, so that I can read it without executing JavaScript.
2. As an agent, I want the article Markdown to be the published source verbatim,
   so that what I read is exactly what the author wrote and what the site
   renders. Title and metadata appear only as the source carries them: the
   source's H1 is the title, and front matter (created, updated, tags) is
   present when the source file has it and absent when it does not. The
   generated listings are the uniform place to find dates and tags for every
   article.
3. As an agent, I want the article body to be the author's Markdown source, not
   HTML converted back to Markdown, so that headings, code blocks, tables, and
   math survive intact.
4. As an agent, I want links and image references to stay exactly as written in
   the source, so that the twin never diverges from the source. Absolute links
   and CDN image URLs resolve as-is; a relative reference resolves against the
   `.md` URL like any relative link, and correcting a broken one is a content
   edit, not a feature behaviour.
5. As an agent, I want the listings and `/llms.txt` to give me Markdown URLs for
   every article, so that I can move between articles while staying in Markdown
   even though in-article links are not rewritten.
6. As an agent, I want `.md` to work on every URL form the site accepts for an
   article: the canonical slug URL, the language-prefixed URL, and the legacy
   dated URL `/[lang/]yyyy/mm/dd/<slug>.md`. For the dated form the date is only
   a routing prefix and is not validated, so any date resolves to the slug's
   article. This is a documented difference from the HTML page, which shows
   not-found when the date does not match the article's creation date.
7. As an agent, I want a renamed article slug with `.md` appended to answer a
   permanent redirect to the current article's `.md` URL on the same host, in
   every language whose index contains the target, so that old links keep
   working the same way they do for humans.

### Languages

8. As an agent, I want `.md` to work for every language the site serves (English
   default and each prefixed language such as `/zhs/...`, `/zht/...`, `/ja/...`),
   so that I can read translated articles.
9. As an agent, I want each language's Markdown to contain that language's
   published source, so that the Markdown matches what a human sees at the same
   URL.
10. As an agent, I want an article with no published source in a language to
    return 404 for that language's `.md` URL, so that I can tell what exists.

### Index and listing pages

11. As an agent, I want the home page with `.md` to return the About source,
    since that is what the home page shows humans. The home forms are
    `/index.md`, `/<lang>.md`, and `/<lang>/index.md`; `/.md` is not a
    supported URL.
12. As an agent, I want `/[lang/]writing.md` to return a Markdown list of all
    posts in that language, newest first, with title, creation date, and
    Markdown link for each, so that I can enumerate the writing.
13. As an agent, I want `/[lang/]tags.md` to return the list of tags with
    article counts and Markdown links to each tag's listing, so that I can
    browse by topic.
14. As an agent, I want `/[lang/]tags/<tag>.md` to return that tag's articles as
    a Markdown list, so that I can read everything on one topic.
15. As an agent, I want every article link in generated listings and
    `/llms.txt` to use the non-dated form `https://luohy15.com/[lang/]<slug>.md`,
    so that there is one canonical Markdown URL per article.
16. As an agent, I want a retired tag (such as `y-agent` or `ai-coding`) with
    `.md` appended to answer a permanent redirect to the canonical tag's `.md`
    listing, matching the HTML redirect.
17. As an agent, I want a legacy encoded tag URL `/[lang/]tags/t.<base64url>.md`
    to behave like its HTML counterpart: when it decodes to a tag that exists
    (after retired-tag mapping), it resolves to that tag's canonical `.md`
    listing, by redirect or by an equivalent listing; otherwise it returns 404.
    Legacy tag coverage must not be silently dropped, and no alias may copy
    article bodies.

### Discovery

18. As an agent that only knows the domain, I want `/llms.txt` to describe the
    site in one short paragraph and list the top-level pages and every English
    article with its Markdown URL, so that I can discover the site in one
    request.
19. As an agent, I want `/llms.txt` to state the `.md` rule (append `.md`, home
    is `/index.md`) and list each language's entry points, so that I can reach
    translated content without guessing URL rules.
20. As an agent that fetched an HTML page, I want a `rel="alternate"
    type="text/markdown"` link in the head pointing to that page's Markdown
    twin, so that I can switch representation without knowing the `.md` rule.

### Protocol correctness

21. As an agent, I want Markdown responses served with
    `Content-Type: text/markdown; charset=utf-8`, so that I can decode non-ASCII
    text correctly.
22. As an agent, I want `/llms.txt` served as `text/plain; charset=utf-8`.
23. As an agent, I want a `.md` URL for a page that does not exist to return a
    real 404 status, not the SPA HTML shell with 200, so that I can tell missing
    content from real content.
24. As an agent, I want redirects for legacy slugs and tags to stay on
    luohy15.com, so that fetchers that refuse cross-host redirects still follow
    them.
25. As an agent, I want Markdown to be as fresh as the published content: the
    site host does not cache `.md` or `/llms.txt`, so a content publish is
    visible without a site invalidation.

### Freshness and maintenance

26. As Roy, I want publishing or editing an article through the existing content
    workflow to update its Markdown twin, the listings, and `/llms.txt` without
    any extra manual step or site rebuild.
27. As Roy, I want listings and `/llms.txt` generated from the same `index.jsonl`
    the site already reads, by tooling in the content repository, so that there
    is one source of truth for what is published.
28. As Roy, I want the content publish to fail rather than publish when an index
    is empty or unparsable, or when a generated path collides with a real
    content file, so that a bad run cannot wipe live navigation.
29. As Roy, I want adding a new tag to need no change to the feature. Adding a
    new language needs its content directory plus the site's language
    definition; routing knowledge (languages, retired tags, legacy tag decoding)
    is shared with or mechanically derived from the site's existing definitions
    where practical, not maintained as independent hard-coded lists.
30. As a human reader, I want the existing pages, URLs, and loading behaviour to
    stay unchanged, so that the agent feature costs me nothing.

## Implementation Decisions

- **`.md` suffix URLs, `/llms.txt`, and the HTML alternate link are required.**
  The alternate link is set at runtime by the SPA to reflect the current route.
- **Source-verbatim semantics.** Article and About twins are the CDN source
  objects, byte for byte. No metadata injection, no front matter stripping, no
  link rewriting. Publishing metadata changes (content type with charset) is
  allowed; body changes are not.
- **Navigation is generated at content publish** in `y-blog-content` from each
  language's `index.jsonl` (languages = the root plus each directory that has an
  index) and uploaded to the same CDN prefix. Generated paths are not committed
  to the content repository.
- **Same-host routing, selected approach.** luohy15.com maps `.md` and
  `/llms.txt` requests to the content bucket as a second origin with no caching,
  so canonical and language-prefixed URLs need no code. A lightweight edge
  router on the site distribution handles what plain mapping cannot under the
  current routing: home forms, dated forms, retired and legacy tag redirects,
  and the SPA fallback for human routes. It replaces the distribution-wide
  403/404 → `/index.html` 200 error responses, which is what makes story 23
  possible. This is the approach selected for the current setup, not a claim
  that no other design could work. A cross-host redirect to the CDN was
  rejected because of story 24.
- **Legacy slugs** are published by the content pipeline as same-host redirect
  objects derived from the content repository's redirect map, per language
  whose index contains the target. They are removed when their redirect map
  entry is removed.
- **Legacy tags.** Retired-tag and `t.<base64url>` handling follows the same
  rules as the SPA's tag module. Whether `t.` parity comes from generated
  navigation aliases or edge decoding is an implementation choice, bound by
  story 17 and story 29.
- **Human-route behaviour change, intended:** after the error responses are
  removed, a missing static asset returns a real 404 instead of the SPA shell.
  Extensionless human routes still get the SPA.
- **Optional mechanisms not taken now:** `Accept: text/markdown` content
  negotiation, `/llms-full.txt`, an HTTP `Link` header for non-JS fetchers.
- **Publication boundary.** The edge router and the distribution changes are a
  production configuration change with per-request billed invocations. They,
  and both repositories' candidates, must be named in a single named-candidate
  publication request that states the exact infrastructure scope before any
  production change. Rollback (restoring the old error responses and removing
  the added origin, behaviours, and associations) is documented with the change.
  Whether the content CI role may publish objects with a website redirect
  location is a verification item for the publish phase.

## Testing Decisions

- The edge router is tested as a pure function: SPA cases unchanged, home forms
  map to About, dated English and prefixed forms map to the slug, retired tags
  redirect, legacy `t.` tags resolve or 404 per story 17, and canonical article
  and tag URLs and `/.md` pass through untouched.
- The navigation generator is tested on a scratch copy of the content
  repository: expected files exist for each language, every generated
  luohy15.com `.md` link maps to a source or generated file, redirect objects
  cover the redirect map, and an empty index fails the run.
- Distribution changes are verified by transforming a saved configuration
  offline and diffing it, not by applying it.
- Post-publish HTTP smoke tests: 200 with the Markdown content type for home,
  Writing, Tags, a tag listing, an article, a dated article, and a prefixed
  article; `/llms.txt` as UTF-8 text; 301 on the same host for a legacy slug, a
  retired tag, and a valid legacy `t.` tag; 404 for an unknown `.md`; human
  routes still 200 HTML; the existing content freshness check passes.
- Per the cross-project default, tests stay local-only unless this repository
  decides otherwise.

## Out of Scope

- Changing the human-facing UI, visual design, or HTML URL scheme.
- Server-side rendering or prerendering HTML; this feature adds a Markdown
  representation, it does not replace the SPA.
- Rewriting, normalising, or annotating article content, including link
  rewriting and metadata injection.
- `/llms-full.txt`, `Accept` content negotiation, and HTTP `Link` headers.
- A search API, JSON API, or MCP server for the blog; RSS or Atom feeds.
- Markdown twins for pages that do not exist on the site today.
- Deploying the edge router through CI; it ships with the manual distribution
  configuration step.
- Tag navigation behaviour itself, owned by `tag-navigation`; this PRD only
  requires Markdown twins of the pages that feature defines.

## Delivery Records

| Todo | Outcome | Design | Plan | Decisions | Review | Status |
|------|---------|--------|------|-----------|--------|--------|
| 3710 | Verbatim twins via same-host routing, content-publish navigation and `/llms.txt`, alternate links (rev 3; build-time candidate `49e1d4a` and rev 2 superseded) | - | `pages/plan-3710-agent-markdown.md` | - | `pages/review-3710-agent-markdown.md` | planned (rev 3), not published |
