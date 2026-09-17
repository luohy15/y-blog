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

- A Tags page joins About and Writing in the header. It is a master-detail
  browser: a list of tags on one side, and the selected tag's articles on the
  other. Only the selected tag's articles are shown at a time, the selected tag
  is clearly marked, and each selection has its own shareable URL.
- Tag chips on an article page link to that tag's listing.
- On an article page, the reader also sees the article lists for the current
  article's tags in context. On desktop the page becomes three columns: tag-based
  cross-article navigation on the left, the article in the centre, and the
  in-article table of contents on the right. The left side changes which article
  you read; the right side changes which section you are in. On mobile the same
  split is exposed through two floating controls, article navigation on the left
  and TOC on the right, that open mutually exclusive panels without consuming
  reading space.
- Tag data stays authoritative in one place in the content repository, and every
  listing (Tags page, per-tag list, in-article related lists) is derived from it.
- A small, content-grounded set of reader-facing tags is applied to the existing
  travel posts as the first real use of the feature.

## User Stories

### Discovering tags

1. As a reader, I want a Tags entry in the top navigation next to About and Writing, so that I can browse the blog by topic instead of only chronologically.
2. As a reader, I want the Tags page to list every tag that has at least one article in a tag list (the master pane), so that I can see what topics the blog covers.
3. As a reader, I want selecting a tag to show only that tag's articles (title and date, newest first, same style as the Writing list) in a detail pane beside the tag list, so that I browse one topic at a time without scrolling past every other tag's articles.
4. As a reader, I want the selected tag to be clearly marked in the tag list, so that I always know which tag the detail pane belongs to.
5. As a reader, I want each selected tag to have its own URL that I can share or bookmark, so that opening that URL lands on the Tags page with that tag already selected and its articles shown.
6. As a reader, I want a sensible state when I open the Tags page without selecting a tag (either the first tag preselected or a short prompt to pick one, as the approved design decides), so that the detail pane is never blank for no reason.
7. As a reader, I want the Tags page and every tag list to respect the current site language, so that I see the articles that exist in my language.
8. As a reader, I want the Tags page to state clearly when no tagged articles exist in my language, so that an empty page does not look broken.
9. As a reader, I want the header to highlight Tags as the active item when I am on the Tags page with or without a selected tag, so that navigation state matches the other nav items.
10. As a mobile reader, I want the same select-one-tag interaction in a compact form (for example the tag list as a horizontal strip or a collapsible list above the articles), so that I still see one tag's articles at a time on a narrow screen.
11. As a reader, I want switching tags to update the URL and the detail pane without a full page reload, and browser back to return to the previously selected tag, so that browsing tags feels like one page.

### Tags on the article page

12. As a reader, I want to see the article's tags near its title, so that I know at a glance what topic it belongs to.
13. As a reader, I want each tag chip on an article to be a link to that tag's article list, so that one tap takes me to related articles.
14. As a reader, I want an article with several tags to show all of them, so that multi-topic articles are reachable from every relevant listing.
15. As a reader, I want articles without tags to look exactly as they do today, so that untagged content is unaffected.

### Contextual related-article lists (desktop)

16. As a desktop reader, I want the article lists for the current article's tags shown in a left sidebar beside the article, so that related articles are visible while I read.
17. As a desktop reader, I want the in-article table of contents shown in a right sidebar, so that left always means "another article" and right always means "another section of this one".
18. As a desktop reader, I want the article to stay centred at its current reading width with both sidebars outside it, so that the three-column layout does not narrow the text.
19. As a desktop reader, I want those lists grouped by tag with a visible tag heading per group, so that I can tell which list belongs to which tag when the article has more than one.
20. As a desktop reader, I want the current article marked in each list and not rendered as a link to itself, so that I do not lose my place.
21. As a desktop reader, I want each group heading to lead to the Tags page with that tag selected, so that I can leave the article and browse the tag.
22. As a desktop reader, I want each sidebar bounded in height and scrolling on its own, so that a long tag list or a long TOC never pushes either sidebar off screen.
23. As a desktop reader, I want the left navigation to appear even when the article has no headings and therefore no TOC, so that a short tagged article still exposes its neighbours and the right column is simply empty.
24. As a desktop reader, I want an untagged article to show only the TOC on the right with an empty left column, so that nothing empty is rendered and the article stays centred.

### Contextual related-article lists (mobile)

25. As a mobile reader, I want a floating article-navigation control on the left and the TOC control on the right, mirroring the desktop sides, so that the article body keeps its full width and the left/right meaning is consistent across devices.
26. As a mobile reader, I want the related lists panel to group articles by tag in the same way as desktop, so that behaviour is consistent across devices.
27. As a mobile reader, I want opening one panel (TOC or related) to close the other, so that the two panels never stack or overlap.
28. As a mobile reader, I want the panel to close when I tap outside it or pick an article, so that it behaves like the existing TOC panel.
29. As a mobile reader, I want the controls to avoid the device safe area and not cover the lightbox controls, so that the existing mobile fixes keep working.
30. As a mobile reader, I want no article-navigation control rendered for an untagged article and no TOC control for an article without headings, so that only controls with content appear.

### Accessibility

31. As a keyboard user, I want tag chips, tag list entries, group headings and the mobile controls to be focusable and activatable with Enter or Space, so that the feature is usable without a pointer.
32. As a screen-reader user, I want the mobile related control to have an accessible name and announce its expanded state, so that I know what it opens.
33. As a screen-reader user, I want the current-article indication to be conveyed in text or ARIA, not only by colour, so that I can tell which item is the page I am on.

### Content and metadata

34. As the author, I want tags to be authoritative in exactly one place in the content repository, so that I never edit the same tag twice for one article.
35. As the author, I want every listing derived from that one source, so that adding a tag to an article automatically updates the Tags page, the tag list and the in-article related lists.
36. As the author, I want the reader-facing tags to be a small, content-grounded set applied to the existing travel posts, so that the feature launches with real navigation value.
37. As the author, I want tags added without any change to article prose or invented travel details, so that content stays as I wrote it.
38. As the author, I want the blog tag vocabulary kept separate from the `y todo` canonical tag vocabulary, so that publishing a blog tag never creates a global system tag.
39. As the author, I want any genuinely ambiguous tag naming (for example whether a tag is a place, a trip, or a theme) converged with me before publication, so that I do not inherit a vocabulary I did not choose.
40. As the author, I want per-language articles to carry the same tags as their source article, so that a tag list in Chinese shows the same trips as in English where translations exist.

### Compatibility

41. As a reader with an old link, I want every existing article URL, legacy path and redirect to keep working, so that the feature adds routes without breaking any.
42. As a reader, I want the new Tags routes to work with the language prefix exactly like Writing, so that the language switcher keeps me on the same page.
43. As a reader, I want browser back and forward to move between article, tag list and Tags page in the expected order, so that navigation feels native.

## Implementation Decisions

- **Feature key** is `tag-navigation` across the PRD index, artifact metadata and todo associations.
- **Two repositories, one feature.** Reader UI lives in `y-blog`. Tag metadata lives in `y-blog-content`, which is a one-way sync target of the author's source directory; tag edits are made at the source and synced, never edited only in the deploy repo. Each repository produces its own named publication candidate.
- **Single authoritative tag source.** Article front matter `tags` is the existing carrier and remains the place tags are authored. Listings must not require the reader's browser to download every article to build a tag index; the per-language index the frontend already fetches must expose tags, derived from front matter rather than hand-maintained. Which existing front matter tags are treated as reader-facing, and how internal tags (hierarchical `knowledge/...` tags, trip identifiers such as `2026-09-boston`) are mapped or filtered, is a content decision recorded in `pages/decision-3585-content-tags.md`; the frontend renders whatever the authoritative source exposes and does not hard-code a vocabulary.
- **Tags page layout.** Master-detail: tag list pane plus a detail pane showing only the selected tag's articles. Selecting a tag is a client-side route change, not a page reload. Desktop places the panes side by side; mobile keeps the same select-one-tag model in a compact adaptation defined by the approved design. The Tags page never renders every tag's articles expanded at once.
- **Routes.** A Tags page and a per-tag selected state are added alongside the existing `/writing` shape, including the language-prefixed variant. The per-tag URL renders the Tags page with that tag selected; there is no separate standalone tag page. No existing route, legacy one- or two-segment path, dated path, or slug redirect changes; every existing article URL is preserved byte for byte. The tag segment in the URL is the canonical identity of the literal tag text: the UTF-8 bytes of the tag encoded as base64url without padding, prefixed with `t.` (the travel tag is `/tags/t.dHJhdmVs`). This preserves every authored tag exactly, including spaces, slashes and non-ASCII text, with no collisions and no normalisation. There are no readable-slug or literal-tag aliases; a segment that is missing the prefix, is not valid base64url, or is not the canonical encoding of its decoded text selects no tag and renders the Tags page's empty-tag state (the "no articles with this tag" copy plus the link back to all tags) without throwing. There is no separate not-found page for tag segments. Readable slugs were considered and rejected as an implementation proposal because they require a normalisation step that can collide; no tag URL has been published, so no legacy tag URL contract exists.
- **Navigation.** The header gains a third entry, Tags, localised in all four languages, positioned after Writing. Active-state logic follows the existing nav items and also marks Tags active when a tag is selected.
- **Desktop layout.** Three columns. The tag-based cross-article navigation takes the existing fixed left sidebar slot (where the TOC is today); the article keeps its current centred width; the in-article TOC moves to a matching fixed right sidebar. Both sidebars share the TOC's visual language (card, heading style, active item styling), are fixed-width rails (224px each, so neither can overlap the centred article), bounded in height and scroll independently. Either sidebar is omitted when it has nothing to show (no tags on the left, no headings on the right) without shifting the article. On viewports too narrow for three columns the mobile controls apply.
- **Mobile layout.** Two floating controls with the same size, shape and elevation as today's TOC button: article navigation anchored bottom-left, TOC anchored bottom-right, matching the desktop sides. Only one panel is open at a time; opening one closes the other. Panels reuse the TOC panel's width, height cap, backdrop and outside-click dismissal. Safe-area offsets and lightbox stacking fixed in todo 3450 are preserved.
- **Multiple tags.** One group per tag in a fixed order (order of tags as authored). The current article appears in each group as a non-link, visibly marked row. A group is omitted only when the tag has no other article in the current language; when all groups would be omitted the whole related block is omitted.
- **Tag chips** on the article header keep their current look and colour hashing but become links.
- **Localisation.** New UI strings (Tags nav label, related-articles heading, empty state, mobile control label) are added to the existing translation table for en, ja, zhs, zht. Tag text itself is content, shown as authored per language.
- **Vocabulary boundary.** Blog tags are public content metadata. Nothing in this feature calls or writes the `y` tag registry.
- **Verification.** Static checks (typecheck, build) and focused tests on the derivation and grouping logic. No agent-driven browser checks or screenshots unless the user asks.

## Testing Decisions

- Test the pure derivation layer, not components: given an index with tags, the set of tags, per-tag article lists (sorted newest first, language-scoped) and the per-article grouped related lists (current article marked, empty groups dropped, order preserved) are deterministic and assertable without a DOM.
- Test URL-segment derivation both ways: tag text to its canonical `t.` base64url segment and back, including non-ASCII tag text, spaces and slashes; assert that unprefixed, literal, padded, or otherwise non-canonical segments decode to no tag (and therefore the empty-tag state) rather than being aliased or throwing.
- Test route resolution for the new Tags and per-tag selected paths with and without a language prefix, including that a per-tag URL resolves to the Tags page with that tag selected, and assert that the existing dated, legacy and redirect paths still resolve as before.
- Test the Tags page selection model: selected tag derived from the URL, default state when no tag is selected, and that only the selected tag's articles are produced for the detail pane.
- Test front matter parsing tolerance: articles without `tags`, empty arrays, and tags with quotes or spaces.
- Harness: the repository commits no test runner and adds no test dependency. The pure-logic modules are covered by test files run locally with the Node built-in runner (`node --test`), alongside the existing typecheck and build. Test files stay local-only per the cross-project policy and are git-ignored.
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
| 3585 | Master-detail Tags page, linked tag chips, three-column article page (left tag navigation, right TOC) with mobile controls, travel-post tags in content | `pages/design-3585.html` (approved) | `pages/plan-3585-tag-navigation.md` | `pages/decision-3585-content-tags.md`; URL identity decision in PRD and plan | `pages/review-3585-content.md`; `pages/review-3585-frontend.md` | reviewed; unpublished |
