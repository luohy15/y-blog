---
title: Blog Tag Navigation
type: prd
project: y-blog
feature: tag-navigation
status: active
---

# Blog Tag Navigation

Durable feature home for tag-based browsing and contextual article navigation on
the personal blog. Requirements here were settled in todo 3585; delivery spans
two repositories (`y-blog` for the reader UI, `y-blog-content` for tag metadata)
but this PRD is the single requirement source for both.

## Problem Statement

Readers reach one article and have no way to find related ones. A visitor on a
travel journal (Boston, Bay Area, Tokyo) cannot see that other travel journals
exist without scanning the whole Writing list. The blog already stores tags in
article front matter, and the article header already renders them, but the chips
are inert: they do not link anywhere, and no page lists articles by tag.

## Solution

Tags become a navigation surface, not just labels:

- A Tags page joins About and Writing in the header. It lists every tag with the
  articles that carry it, so a reader can browse the blog by topic.
- Tag chips on an article page link to that tag's listing.
- On an article page, the reader also sees the article lists for the current
  article's tags in context: on desktop below the table of contents, clearly
  grouped by tag, with the current article indicated; on mobile through a
  floating control next to the existing TOC button that opens the same grouped
  lists without consuming reading space.
- Tag data stays authoritative in one place in the content repository, and every
  listing (Tags page, per-tag list, in-article related lists) is derived from it.
- A small, content-grounded set of reader-facing tags is applied to the existing
  travel posts as the first real use of the feature.

## User Stories

### Discovering tags

1. As a reader, I want a Tags entry in the top navigation next to About and Writing, so that I can browse the blog by topic instead of only chronologically.
2. As a reader, I want the Tags page to list every tag that has at least one article, so that I can see what topics the blog covers.
3. As a reader, I want each tag on the Tags page to show its articles (title and date, newest first, same style as the Writing list), so that the page is directly useful without another click.
4. As a reader, I want to open a single tag's article list from a link I can share or bookmark, so that I can return to "all travel journals" directly.
5. As a reader, I want the Tags page and every tag list to respect the current site language, so that I see the articles that exist in my language.
6. As a reader, I want the Tags page to state clearly when no tagged articles exist in my language, so that an empty page does not look broken.
7. As a reader, I want the header to highlight Tags as the active item when I am on the Tags page or a tag list, so that navigation state matches the other nav items.

### Tags on the article page

8. As a reader, I want to see the article's tags near its title, so that I know at a glance what topic it belongs to.
9. As a reader, I want each tag chip on an article to be a link to that tag's article list, so that one tap takes me to related articles.
10. As a reader, I want an article with several tags to show all of them, so that multi-topic articles are reachable from every relevant listing.
11. As a reader, I want articles without tags to look exactly as they do today, so that untagged content is unaffected.

### Contextual related-article lists (desktop)

12. As a desktop reader, I want the article lists for the current article's tags shown below the table of contents, so that related articles are visible while I read.
13. As a desktop reader, I want those lists grouped by tag with a visible tag heading per group, so that I can tell which list belongs to which tag when the article has more than one.
14. As a desktop reader, I want the current article marked in each list and not rendered as a link to itself, so that I do not lose my place.
15. As a desktop reader, I want each group heading to lead to that tag's full listing, so that I can leave the article and browse the tag.
16. As a desktop reader, I want the related lists to scroll independently or stay bounded in height, so that a long tag or a long TOC never pushes the sidebar off screen.
17. As a desktop reader, I want the related lists to appear even when the article has no headings and therefore no TOC, so that a short tagged article still exposes its neighbours.
18. As a desktop reader, I want an untagged article to show only the TOC as it does today, so that nothing empty is rendered.

### Contextual related-article lists (mobile)

19. As a mobile reader, I want a floating control alongside the existing TOC button that opens the related-article lists, so that the article body keeps its full width and reading space.
20. As a mobile reader, I want the related lists panel to group articles by tag in the same way as desktop, so that behaviour is consistent across devices.
21. As a mobile reader, I want opening one panel (TOC or related) to close the other, so that the two panels never stack or overlap.
22. As a mobile reader, I want the panel to close when I tap outside it or pick an article, so that it behaves like the existing TOC panel.
23. As a mobile reader, I want the controls to avoid the device safe area and not cover the lightbox controls, so that the existing mobile fixes keep working.
24. As a mobile reader, I want no related control rendered for an untagged article, so that the TOC button stays alone where it is today.

### Accessibility

25. As a keyboard user, I want tag chips, tag list entries, group headings and the mobile controls to be focusable and activatable with Enter or Space, so that the feature is usable without a pointer.
26. As a screen-reader user, I want the mobile related control to have an accessible name and announce its expanded state, so that I know what it opens.
27. As a screen-reader user, I want the current-article indication to be conveyed in text or ARIA, not only by colour, so that I can tell which item is the page I am on.

### Content and metadata

28. As the author, I want tags to be authoritative in exactly one place in the content repository, so that I never edit the same tag twice for one article.
29. As the author, I want every listing derived from that one source, so that adding a tag to an article automatically updates the Tags page, the tag list and the in-article related lists.
30. As the author, I want the reader-facing tags to be a small, content-grounded set applied to the existing travel posts, so that the feature launches with real navigation value.
31. As the author, I want tags added without any change to article prose or invented travel details, so that content stays as I wrote it.
32. As the author, I want the blog tag vocabulary kept separate from the `y todo` canonical tag vocabulary, so that publishing a blog tag never creates a global system tag.
33. As the author, I want any genuinely ambiguous tag naming (for example whether a tag is a place, a trip, or a theme) converged with me before publication, so that I do not inherit a vocabulary I did not choose.
34. As the author, I want per-language articles to carry the same tags as their source article, so that a tag list in Chinese shows the same trips as in English where translations exist.

### Compatibility

35. As a reader with an old link, I want every existing article URL, legacy path and redirect to keep working, so that the feature adds routes without breaking any.
36. As a reader, I want the new Tags routes to work with the language prefix exactly like Writing, so that the language switcher keeps me on the same page.
37. As a reader, I want browser back and forward to move between article, tag list and Tags page in the expected order, so that navigation feels native.

## Implementation Decisions

- **Feature key** is `tag-navigation` across the PRD index, artifact metadata and todo associations.
- **Two repositories, one feature.** Reader UI lives in `y-blog`. Tag metadata lives in `y-blog-content`, which is a one-way sync target of the author's source directory; tag edits are made at the source and synced, never edited only in the deploy repo. Each repository produces its own named publication candidate.
- **Single authoritative tag source.** Article front matter `tags` is the existing carrier and remains the place tags are authored. Listings must not require the reader's browser to download every article to build a tag index; the per-language index the frontend already fetches must expose tags, derived from front matter rather than hand-maintained. Which existing front matter tags are treated as reader-facing, and how internal tags (hierarchical `knowledge/...` tags, trip identifiers such as `2026-09-boston`) are mapped or filtered, is a content decision recorded in `pages/decision-3585-content-tags.md`; the frontend renders whatever the authoritative source exposes and does not hard-code a vocabulary.
- **Routes.** A Tags page and a per-tag listing are added alongside the existing `/writing` shape, including the language-prefixed variant. No existing route, legacy one- or two-segment path, dated path, or slug redirect changes. The tag segment in the URL is derived from the tag text in a stable, URL-safe way so a tag list can be shared.
- **Navigation.** The header gains a third entry, Tags, localised in all four languages, positioned after Writing. Active-state logic follows the existing nav items and also marks Tags active on a per-tag listing.
- **Desktop layout.** The related-article groups render in the existing fixed left sidebar under the TOC, sharing its visual language (card, heading style, active item styling). The sidebar is bounded in height with its own scrolling so TOC plus related lists never overflow the viewport. The related block renders independently of whether the article has any headings.
- **Mobile layout.** A second floating control is added next to the existing TOC button using the same size, shape and elevation. Both controls belong to one stacking group so only one panel is open at a time. Panels reuse the TOC panel's width, height cap, backdrop and outside-click dismissal. Safe-area offsets and lightbox stacking fixed in todo 3450 are preserved.
- **Multiple tags.** One group per tag in a fixed order (order of tags as authored). The current article appears in each group as a non-link, visibly marked row. A group is omitted only when the tag has no other article in the current language; when all groups would be omitted the whole related block is omitted.
- **Tag chips** on the article header keep their current look and colour hashing but become links.
- **Localisation.** New UI strings (Tags nav label, related-articles heading, empty state, mobile control label) are added to the existing translation table for en, ja, zhs, zht. Tag text itself is content, shown as authored per language.
- **Vocabulary boundary.** Blog tags are public content metadata. Nothing in this feature calls or writes the `y` tag registry.
- **Verification.** Static checks (typecheck, build) and focused tests on the derivation and grouping logic. No agent-driven browser checks or screenshots unless the user asks.

## Testing Decisions

- Test the pure derivation layer, not components: given an index with tags, the set of tags, per-tag article lists (sorted newest first, language-scoped) and the per-article grouped related lists (current article marked, empty groups dropped, order preserved) are deterministic and assertable without a DOM.
- Test URL-segment derivation both ways: tag text to segment and segment back to the tag's listing, including non-ASCII tag text.
- Test route resolution for the new Tags and per-tag paths with and without a language prefix, and assert that the existing dated, legacy and redirect paths still resolve as before.
- Test front matter parsing tolerance: articles without `tags`, empty arrays, and tags with quotes or spaces.
- Prior art: the repository currently has no test runner; the plan for the first delivery decides the minimal harness (the project already uses Vite, so its bundled test runner is the default choice). Test files stay local-only per the cross-project policy unless the project decides otherwise.
- Content-side check: the derived index and the front matter agree for every article in every language directory, run as part of the content candidate before publication.

## Out of Scope

- Tag search, tag counts as a cloud, or tag-based RSS feeds.
- Retagging non-travel articles beyond what the content decision note proposes; the launch set is the travel posts.
- Rewriting article prose, titles, or dates.
- Any change to the `y` todo tag vocabulary or registry.
- Related-article recommendations by similarity rather than by shared tag.
- Migrating the blog off its current hosting or changing the sync pipeline beyond exposing tags in the index.
- Agent-driven browser screenshots or runtime UI checks; runtime verification is the user's.

## Delivery Records

| Todo | Outcome | Design | Plan | Decisions | Review | Status |
|------|---------|--------|------|-----------|--------|--------|
| 3585 | Tags page, linked tag chips, contextual related lists (desktop sidebar, mobile control), travel-post tags in content | - | - | `pages/decision-3585-content-tags.md` | - | planned |
