#!/bin/bash
set -euo pipefail

CDN="https://cdn.luohy15.com/blog"
AVATAR="images/avatar-luohy15.svg"
LOCALES=("" "zhs" "zht" "ja")

fail() {
    echo "FAIL: $*" >&2
    exit 1
}

assert_http_200() {
    local headers="$1"
    local label="$2"
    echo "$headers" | grep -qE "^HTTP/[^ ]+ 200" || fail "${label} is not 200"
}

check_about() {
    local locale="$1"
    local path
    if [ -z "$locale" ]; then
        path="about.md"
    else
        path="${locale}/about.md"
    fi
    local url="${CDN}/${path}"
    local label="${locale:-en}"
    local body
    body=$(mktemp)

    local headers
    headers=$(curl -sS -D - -o "$body" "$url") || { rm -f "$body"; fail "${label} about.md curl failed"; }
    assert_http_200 "$headers" "${label} about.md"
    echo "$headers" | grep -qi "^Cache-Control:" || { rm -f "$body"; fail "${label} about.md missing Cache-Control"; }
    grep -q "avatar-luohy15.svg" "$body" || { rm -f "$body"; fail "${label} about.md missing avatar-luohy15.svg"; }
    rm -f "$body"
    echo "OK ${label} ${url}"
}

svg_headers=$(curl -sSI "${CDN}/${AVATAR}") || fail "SVG HEAD failed"
assert_http_200 "$svg_headers" "SVG"
echo "$svg_headers" | grep -qi "^Content-Type: *image/svg+xml" || fail "SVG Content-Type is not image/svg+xml"
echo "OK svg ${CDN}/${AVATAR}"

for locale in "${LOCALES[@]}"; do
    check_about "$locale"
done

echo "content freshness check passed"
