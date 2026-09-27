// CloudFront Function (viewer-request, cloudfront-js-2.0 runtime).
//
// The site is a single-page app served from an S3 origin: every human route
// (/, /writing, /zhs/tags/ai-agent, ...) has no matching S3 object, so it
// must fall through to /index.html for the client router to render it. Real
// static assets (.js, .css, images, the generated Markdown twins, .txt,
// .xml, ...) must be left alone so the origin serves them directly.
//
// Rule: if the URI's last path segment has no extension, or has an
// extension that is not in the allowlist below, rewrite the URI to
// /index.html. Otherwise leave the request untouched. This preserves
// existing HTML routes whose slug happens to contain a dot (the dot is not
// a recognized asset extension, so the request still falls through to the
// SPA) instead of hard-coding a route allowlist that would drift from
// routes.ts.
//
// A dot at position 0 of the last segment (e.g. the literal path `/.md` or
// `/writing/.md`) still counts as having the `md` extension: those paths are
// not the documented Markdown twin form (`/index.md`, `/writing.md`), so they
// must fall through to the S3 origin and 404 there (CustomErrorResponses ->
// /404.md), not get rewritten to the SPA shell and return 200 HTML.
var ALLOWED_EXTENSIONS = [
    'md', 'txt', 'js', 'css', 'png', 'svg', 'ico', 'jpg', 'jpeg', 'gif',
    'webp', 'json', 'xml', 'woff', 'woff2', 'map', 'pdf',
];

function handler(event) {
    var request = event.request;
    var uri = request.uri;
    var lastSegment = uri.substring(uri.lastIndexOf('/') + 1);
    var dotIndex = lastSegment.lastIndexOf('.');

    if (dotIndex >= 0) {
        var extension = lastSegment.substring(dotIndex + 1).toLowerCase();
        if (ALLOWED_EXTENSIONS.indexOf(extension) !== -1) {
            return request;
        }
    }

    request.uri = '/index.html';
    return request;
}
