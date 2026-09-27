// CloudFront Function (viewer-request, cloudfront-js-2.0 runtime), associated
// with both the default cache behavior (site S3 origin) and the `*.md` /
// `/llms.txt` cache behavior (content S3 origin, OriginPath `/blog`).
//
// Two independent jobs, split by whether the request is a `.md`/`llms.txt`
// content request or a normal site request:
//
// 1. Site requests (default behavior): the site is an SPA served from S3 --
//    every human route (/, /writing, /zhs/tags/ai-agent, ...) has no matching
//    S3 object and must fall through to /index.html for the client router.
//    Real static assets (.js, .css, images, ...) must be left alone.
// 2. Content requests (`*.md` / `/llms.txt` behavior): canonical and
//    language-prefixed article/about/listing/llms.txt paths map to a content
//    object with no rewriting needed. Three forms don't: home (`/index.md`,
//    `/<lang>.md`, `/<lang>/index.md` -> about), dated
//    (`/[lang/]yyyy/mm/dd/<slug>.md` -> `/[lang/]<slug>.md`, date not
//    validated), and the two retired tag names (301 to the canonical tag).
//    Everything else -- including a literal `/.md` or `/<route>/.md`, which
//    matches none of these rules -- passes through unchanged and 404s at the
//    origin; there are no CustomErrorResponses left to turn that into a 200.
//
// LANGUAGES mirrors src/lib/language.ts's non-default language codes;
// RETIRED_TAGS mirrors src/lib/tags.ts's retired-tag mapping. CloudFront
// Functions cannot import site modules at runtime, so
// tests/site-router.test.ts asserts these stay in sync.
var LANGUAGES = ['ja', 'zhs', 'zht'];
var RETIRED_TAGS = { 'y-agent': 'ai-agent', 'ai-coding': 'ai-agent' };

var SITE_ALLOWED_EXTENSIONS = [
    'txt', 'js', 'css', 'png', 'svg', 'ico', 'jpg', 'jpeg', 'gif',
    'webp', 'json', 'xml', 'woff', 'woff2', 'map', 'pdf',
];

function isContentRequest(uri) {
    return /\.md$/i.test(uri) || uri === '/llms.txt';
}

function splitLangPrefix(segments) {
    if (segments.length > 0 && LANGUAGES.indexOf(segments[0]) !== -1) {
        return { lang: segments[0], rest: segments.slice(1) };
    }
    return { lang: null, rest: segments };
}

function withLang(lang, path) {
    return lang ? '/' + lang + path : path;
}

function routeContentRequest(request) {
    var uri = request.uri;

    // Bare `/<lang>.md` home-form shorthand (no slash after the language).
    var bareLangMatch = /^\/([a-z]{2,3})\.md$/.exec(uri);
    if (bareLangMatch && LANGUAGES.indexOf(bareLangMatch[1]) !== -1) {
        request.uri = '/' + bareLangMatch[1] + '/about.md';
        return request;
    }

    var segments = uri.split('/').filter(function (s) { return s.length > 0; });
    var split = splitLangPrefix(segments);
    var lang = split.lang;
    var rest = split.rest;

    // Home forms: `/index.md`, `/<lang>/index.md` -> about.
    if (rest.length === 1 && rest[0] === 'index.md') {
        request.uri = withLang(lang, '/about.md');
        return request;
    }

    // Dated forms: `/[lang/]yyyy/mm/dd/<slug>.md` -> `/[lang/]<slug>.md`.
    if (
        rest.length === 4 &&
        /^\d{4}$/.test(rest[0]) &&
        /^\d{2}$/.test(rest[1]) &&
        /^\d{2}$/.test(rest[2]) &&
        /\.md$/i.test(rest[3])
    ) {
        request.uri = withLang(lang, '/' + rest[3]);
        return request;
    }

    // Retired tags: `/[lang/]tags/(y-agent|ai-coding).md` -> 301 to the
    // canonical tag's listing.
    if (rest.length === 2 && rest[0] === 'tags' && /\.md$/i.test(rest[1])) {
        var tagName = rest[1].slice(0, -3);
        var canonicalTag = RETIRED_TAGS[tagName];
        if (canonicalTag) {
            return {
                statusCode: 301,
                statusDescription: 'Moved Permanently',
                headers: {
                    location: { value: withLang(lang, '/tags/' + canonicalTag + '.md') },
                },
            };
        }
    }

    // Everything else (canonical article/about, writing, tags, tag listing,
    // llms.txt, legacy slug/tag redirect objects, an unmatched `.md`) passes
    // through unchanged.
    return request;
}

function routeSiteRequest(request) {
    var uri = request.uri;
    var lastSegment = uri.substring(uri.lastIndexOf('/') + 1);
    var dotIndex = lastSegment.lastIndexOf('.');

    if (dotIndex >= 0) {
        var extension = lastSegment.substring(dotIndex + 1).toLowerCase();
        if (SITE_ALLOWED_EXTENSIONS.indexOf(extension) !== -1) {
            return request;
        }
    }

    request.uri = '/index.html';
    return request;
}

function handler(event) {
    var request = event.request;
    if (isContentRequest(request.uri)) {
        return routeContentRequest(request);
    }
    return routeSiteRequest(request);
}
