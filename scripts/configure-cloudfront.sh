#!/bin/bash
set -euo pipefail

# Configure CloudFront for the agent-Markdown feature (rev 3: CDN-published
# navigation + static routing; see pages/plan-3710-agent-markdown.md):
#
#  - add the content bucket's website endpoint as a second origin, with
#    OriginPath "/blog" (so `/boston-2026.md` maps to the content bucket's
#    `blog/boston-2026.md` key with no rewriting), CachingDisabled (the
#    content pipeline already stamps freshness metadata, and luohy15.com must
#    never itself cache stale content).
#  - add two cache behaviors targeting that origin: path pattern `*.md` and
#    the exact path `/llms.txt`.
#  - create-or-update the `site-router` CloudFront Function (viewer-request,
#    cloudfront-js-2.0, see cloudfront/site-router.js) and associate it with
#    the default behavior (SPA fallback for human routes) and both new
#    behaviors (home/dated/retired-tag routing for `.md` requests; see the
#    function file's own header for the exact rules), and publish it to LIVE.
#  - remove CustomErrorResponses entirely (Quantity 0): once the function
#    guarantees every extensionless human route already resolves to
#    /index.html before the origin sees it, the old distribution-wide
#    403/404 -> /index.html 200 override is not just unnecessary, it actively
#    breaks the Markdown feature's 404 contract (story 23) by turning a
#    missing `.md` object into a 200 SPA response.
#
# All of the above is applied in a single update-distribution call, so the
# distribution never sits in a state where the origins/behaviors and the
# routing function disagree with the error-response configuration.
#
# Idempotent: recomputes the desired state and only calls
# create/update/publish-function (compared against the function's current
# LIVE-stage code, since LIVE is what actually serves traffic) or
# update-distribution when something actually differs from the fetched
# current state.
#
# Required env: CLOUDFRONT_DISTRIBUTION_ID, CONTENT_ORIGIN_DOMAIN (the
#   content bucket's S3 website endpoint, e.g.
#   y-blog-content-695860013558.s3-website-us-east-1.amazonaws.com --
#   verified read-only against this account's actual bucket on 2026-09-27;
#   not hard-coded here since it is account-specific infrastructure data, not
#   feature logic)
# Optional env: AWS_PROFILE, CLOUDFRONT_FUNCTION_NAME (default: site-router)
#
# --- Rollback (documentation only; not implemented here, not authorized to run) ---
# If a rollback is ever authorized, all of the following must land together,
# in one update-distribution call, the same way the forward change did:
#   1. Remove the content origin and its two cache behaviors (`*.md`,
#      `/llms.txt`).
#   2. DefaultCacheBehavior.FunctionAssociations back to empty (Quantity 0,
#      Items []) to disassociate the site-router function from the default
#      behavior (it has no cache behavior left to run on for the `.md` /
#      `llms.txt` case once step 1 removes those).
#   3. CustomErrorResponses back to the pre-feature config: 403 and 404 both
#      -> ResponsePagePath "/index.html", ResponseCode "200".
# The CloudFront Function resource itself (site-router) can be left in place
# (DEVELOPMENT/LIVE) after disassociation; it does nothing while unassociated.

if [ -z "${CLOUDFRONT_DISTRIBUTION_ID:-}" ]; then
    echo "Error: CLOUDFRONT_DISTRIBUTION_ID is not set" >&2
    exit 1
fi

if [ -z "${CONTENT_ORIGIN_DOMAIN:-}" ]; then
    echo "Error: CONTENT_ORIGIN_DOMAIN is not set (content bucket S3 website endpoint)" >&2
    exit 1
fi

FUNCTION_NAME="${CLOUDFRONT_FUNCTION_NAME:-site-router}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FUNCTION_CODE_PATH="$SCRIPT_DIR/cloudfront/site-router.js"

if [ ! -f "$FUNCTION_CODE_PATH" ]; then
    echo "Error: $FUNCTION_CODE_PATH not found" >&2
    exit 1
fi

PROFILE_FLAG=""
if [ -n "${AWS_PROFILE:-}" ]; then
    PROFILE_FLAG="--profile $AWS_PROFILE"
fi

WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

FUNCTION_CONFIG='{"Comment": "SPA fallback + Markdown/llms.txt routing for luohy15.com", "Runtime": "cloudfront-js-2.0"}'

# --- 1. Create-or-update the CloudFront Function, publish DEVELOPMENT -> LIVE ---
# Compared against LIVE (what actually serves traffic), not DEVELOPMENT, so
# create/update/publish are all skipped once the live function already
# matches the desired code -- publish-function is not called unconditionally.

FUNCTION_ARN=""
LIVE_CODE_MATCHES=false

if aws cloudfront describe-function \
    $PROFILE_FLAG \
    --name "$FUNCTION_NAME" \
    --stage LIVE \
    --output json > "$WORK_DIR/live-function-describe.json" 2>/dev/null; then
    aws cloudfront get-function \
        $PROFILE_FLAG \
        --name "$FUNCTION_NAME" \
        --stage LIVE \
        "$WORK_DIR/live-function-code.js" > /dev/null

    if diff -q "$WORK_DIR/live-function-code.js" "$FUNCTION_CODE_PATH" > /dev/null 2>&1; then
        LIVE_CODE_MATCHES=true
        FUNCTION_ARN=$(jq -r '.FunctionSummary.FunctionMetadata.FunctionARN' "$WORK_DIR/live-function-describe.json")
    fi
fi

if [ "$LIVE_CODE_MATCHES" = true ]; then
    echo "CloudFront function $FUNCTION_NAME LIVE code already up to date; skipping create/update/publish."
else
    if aws cloudfront describe-function \
        $PROFILE_FLAG \
        --name "$FUNCTION_NAME" \
        --stage DEVELOPMENT \
        --output json > "$WORK_DIR/dev-function-describe.json" 2>/dev/null; then
        FUNCTION_ETAG=$(jq -r '.ETag' "$WORK_DIR/dev-function-describe.json")
        aws cloudfront get-function \
            $PROFILE_FLAG \
            --name "$FUNCTION_NAME" \
            --stage DEVELOPMENT \
            "$WORK_DIR/dev-function-code.js" > /dev/null

        if diff -q "$WORK_DIR/dev-function-code.js" "$FUNCTION_CODE_PATH" > /dev/null 2>&1; then
            echo "CloudFront function $FUNCTION_NAME DEVELOPMENT code already matches desired code; publishing to LIVE."
        else
            echo "Updating CloudFront function $FUNCTION_NAME code..."
            aws cloudfront update-function \
                $PROFILE_FLAG \
                --name "$FUNCTION_NAME" \
                --if-match "$FUNCTION_ETAG" \
                --function-config "$FUNCTION_CONFIG" \
                --function-code "fileb://$FUNCTION_CODE_PATH" \
                --output json > "$WORK_DIR/function-updated.json"
            FUNCTION_ETAG=$(jq -r '.ETag' "$WORK_DIR/function-updated.json")
        fi
    else
        echo "Creating CloudFront function $FUNCTION_NAME..."
        aws cloudfront create-function \
            $PROFILE_FLAG \
            --name "$FUNCTION_NAME" \
            --function-config "$FUNCTION_CONFIG" \
            --function-code "fileb://$FUNCTION_CODE_PATH" \
            --output json > "$WORK_DIR/function-created.json"
        FUNCTION_ETAG=$(jq -r '.ETag' "$WORK_DIR/function-created.json")
    fi

    aws cloudfront publish-function \
        $PROFILE_FLAG \
        --name "$FUNCTION_NAME" \
        --if-match "$FUNCTION_ETAG" \
        --output json > "$WORK_DIR/function-published.json"

    FUNCTION_ARN=$(jq -r '.FunctionSummary.FunctionMetadata.FunctionARN' "$WORK_DIR/function-published.json")
fi

echo "CloudFront function live: $FUNCTION_ARN"

# --- 2. Add the content origin + two behaviors, associate the function, and ---
# --- remove CustomErrorResponses, in one update-distribution call.         ---

CURRENT="$WORK_DIR/current-distribution.json"
NEW_CONFIG="$WORK_DIR/new-distribution-config.json"

echo "Fetching current distribution config for $CLOUDFRONT_DISTRIBUTION_ID..."
aws cloudfront get-distribution-config \
    $PROFILE_FLAG \
    --id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --output json > "$CURRENT"

DIST_ETAG=$(jq -r '.ETag' "$CURRENT")

CONTENT_ORIGIN_ID="ContentOrigin"
# AWS managed "CachingDisabled" cache policy (TTL 0); a stable, publicly
# documented ID, not account-specific -- see AWS docs "Managed cache
# policies".
CACHING_DISABLED_POLICY_ID="4135ea2d-6df8-44a3-9df3-4b5a84be39ad"

DESIRED_CONTENT_ORIGIN=$(jq -cn --arg id "$CONTENT_ORIGIN_ID" --arg domain "$CONTENT_ORIGIN_DOMAIN" '
    {
        Id: $id,
        DomainName: $domain,
        OriginPath: "/blog",
        CustomHeaders: { Quantity: 0 },
        CustomOriginConfig: {
            HTTPPort: 80,
            HTTPSPort: 443,
            OriginProtocolPolicy: "http-only",
            OriginSslProtocols: { Quantity: 2, Items: ["SSLv3", "TLSv1"] },
            OriginReadTimeout: 30,
            OriginKeepaliveTimeout: 5
        },
        ConnectionAttempts: 3,
        ConnectionTimeout: 10,
        OriginShield: { Enabled: false },
        OriginAccessControlId: ""
    }
')

DESIRED_FUNCTION_ASSOCIATIONS=$(jq -cn --arg arn "$FUNCTION_ARN" '
    { Quantity: 1, Items: [{ FunctionARN: $arn, EventType: "viewer-request" }] }
')

MD_BEHAVIOR=$(jq -cn --arg originId "$CONTENT_ORIGIN_ID" --arg cachePolicyId "$CACHING_DISABLED_POLICY_ID" --argjson functionAssociations "$DESIRED_FUNCTION_ASSOCIATIONS" '
    {
        PathPattern: "*.md",
        TargetOriginId: $originId,
        ViewerProtocolPolicy: "redirect-to-https",
        AllowedMethods: { Quantity: 2, Items: ["HEAD", "GET"], CachedMethods: { Quantity: 2, Items: ["HEAD", "GET"] } },
        Compress: false,
        SmoothStreaming: false,
        LambdaFunctionAssociations: { Quantity: 0 },
        FunctionAssociations: $functionAssociations,
        FieldLevelEncryptionId: "",
        CachePolicyId: $cachePolicyId,
        TrustedSigners: { Enabled: false, Quantity: 0 },
        TrustedKeyGroups: { Enabled: false, Quantity: 0 },
        GrpcConfig: { Enabled: false }
    }
')
LLMS_BEHAVIOR=$(echo "$MD_BEHAVIOR" | jq -c '.PathPattern = "/llms.txt"')
DESIRED_BEHAVIOR_ITEMS=$(jq -cn --argjson md "$MD_BEHAVIOR" --argjson llms "$LLMS_BEHAVIOR" '[$md, $llms] | sort_by(.PathPattern)')

echo "Updating distribution: content origin + *.md/llms.txt behaviors + site-router associations + CustomErrorResponses removal..."
jq \
    --argjson contentOrigin "$DESIRED_CONTENT_ORIGIN" \
    --argjson functionAssociations "$DESIRED_FUNCTION_ASSOCIATIONS" \
    --argjson behaviorItems "$DESIRED_BEHAVIOR_ITEMS" \
    '
    .DistributionConfig as $dc
    | ($dc.Origins.Items | map(select(.Id != $contentOrigin.Id)) + [$contentOrigin]) as $origins
    | ($dc.CacheBehaviors.Items // [] | map(select(.PathPattern != "*.md" and .PathPattern != "/llms.txt")) + $behaviorItems) as $behaviors
    | $dc
    | .Origins = { Quantity: ($origins | length), Items: $origins }
    | .CacheBehaviors = { Quantity: ($behaviors | length), Items: $behaviors }
    | .DefaultCacheBehavior.FunctionAssociations = $functionAssociations
    | .CustomErrorResponses = { Quantity: 0, Items: [] }
' "$CURRENT" > "$NEW_CONFIG"

if diff -q <(jq -S '.DistributionConfig' "$CURRENT") <(jq -S '.' "$NEW_CONFIG") > /dev/null 2>&1; then
    echo "Distribution config already matches desired state — nothing to do."
    exit 0
fi

aws cloudfront update-distribution \
    $PROFILE_FLAG \
    --id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --if-match "$DIST_ETAG" \
    --distribution-config "file://$NEW_CONFIG" \
    --no-cli-pager > /dev/null

echo "Update submitted. CloudFront will propagate the change in a few minutes."
