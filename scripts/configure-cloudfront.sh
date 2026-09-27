#!/bin/bash
set -euo pipefail

# Configure CloudFront for the agent-Markdown feature:
#  - create-or-update the `spa-rewrite` CloudFront Function (viewer-request,
#    cloudfront-js-2.0, see cloudfront/spa-rewrite.js) that lets human SPA
#    routes fall through to /index.html while leaving real static assets
#    (including the generated Markdown twins and llms.txt) untouched, and
#    publish it to LIVE.
#  - associate that function with the default cache behavior and change
#    CustomErrorResponses so a missing path from the S3 origin (403/404)
#    serves /404.md with a real HTTP 404, instead of the old /index.html 200
#    SPA-fallback trick that the function now makes unnecessary.
#
# Both the function association and the CustomErrorResponses change are
# applied in a single update-distribution call so the distribution never sits
# in a state where the 404 behavior and the routing function disagree.
#
# Idempotent: recomputes the desired state and only calls
# create/update/publish-function (compared against the function's current
# LIVE-stage code, since LIVE is what actually serves traffic) or
# update-distribution when something actually differs from the fetched
# current state.
#
# Required env: CLOUDFRONT_DISTRIBUTION_ID
# Optional env: AWS_PROFILE, CLOUDFRONT_FUNCTION_NAME (default: spa-rewrite)
#
# --- Rollback (documentation only; not implemented here, not authorized to run) ---
# This script does not perform rollback. Reverting the CustomErrorResponses
# change alone is not sufficient: as long as this function stays associated,
# routes with no matching S3 object are 200-served /404.md by the function's
# own /index.html-less design fully relying on the *new* error-response
# semantics (ResponseCode 404). If a rollback is ever authorized, both of the
# following must land together, in one update-distribution call, the same way
# the forward change did:
#   1. CustomErrorResponses back to the pre-feature config: 403 and 404 both
#      -> ResponsePagePath "/index.html", ResponseCode "200".
#   2. DefaultCacheBehavior.FunctionAssociations back to empty (Quantity 0,
#      Items []) to disassociate the spa-rewrite function — leaving it
#      associated with the reverted 200/index.html error responses would
#      still work by accident (unmatched routes still reach /index.html via
#      the SPA-shell branch of the function), but it leaves an unused
#      dependency on a function whose only reason to exist was this feature.
# The CloudFront Function resource itself (spa-rewrite) can be left in place
# (DEVELOPMENT/LIVE) after disassociation; it does nothing while unassociated.

if [ -z "${CLOUDFRONT_DISTRIBUTION_ID:-}" ]; then
    echo "Error: CLOUDFRONT_DISTRIBUTION_ID is not set" >&2
    exit 1
fi

FUNCTION_NAME="${CLOUDFRONT_FUNCTION_NAME:-spa-rewrite}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FUNCTION_CODE_PATH="$SCRIPT_DIR/cloudfront/spa-rewrite.js"

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

FUNCTION_CONFIG='{"Comment": "SPA route fallback + Markdown twin passthrough for luohy15.com", "Runtime": "cloudfront-js-2.0"}'

# --- 1. Create-or-update the CloudFront Function, publish DEVELOPMENT -> LIVE ---
# Compared against LIVE (what actually serves traffic), not DEVELOPMENT, so
# create/update/publish are all skipped once the live function already
# matches the desired code — publish-function is not called unconditionally.

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

# --- 2. Associate the function + set CustomErrorResponses, in one update-distribution call ---

CURRENT="$WORK_DIR/current-distribution.json"
NEW_CONFIG="$WORK_DIR/new-distribution-config.json"

echo "Fetching current distribution config for $CLOUDFRONT_DISTRIBUTION_ID..."
aws cloudfront get-distribution-config \
    $PROFILE_FLAG \
    --id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --output json > "$CURRENT"

DIST_ETAG=$(jq -r '.ETag' "$CURRENT")

DESIRED_ERROR_ITEMS='[
    {
        "ErrorCode": 403,
        "ResponsePagePath": "/404.md",
        "ResponseCode": "404",
        "ErrorCachingMinTTL": 0
    },
    {
        "ErrorCode": 404,
        "ResponsePagePath": "/404.md",
        "ResponseCode": "404",
        "ErrorCachingMinTTL": 0
    }
]'
DESIRED_ERROR_SORTED=$(echo "$DESIRED_ERROR_ITEMS" | jq -c 'sort_by(.ErrorCode)')
CURRENT_ERROR_ITEMS=$(jq -c '.DistributionConfig.CustomErrorResponses.Items // [] | sort_by(.ErrorCode)' "$CURRENT")

DESIRED_FUNCTION_ASSOCIATIONS=$(jq -cn --arg arn "$FUNCTION_ARN" '[{"FunctionARN": $arn, "EventType": "viewer-request"}]')
CURRENT_FUNCTION_ASSOCIATIONS=$(jq -c '.DistributionConfig.DefaultCacheBehavior.FunctionAssociations.Items // []' "$CURRENT")

if [ "$CURRENT_ERROR_ITEMS" = "$DESIRED_ERROR_SORTED" ] && [ "$CURRENT_FUNCTION_ASSOCIATIONS" = "$DESIRED_FUNCTION_ASSOCIATIONS" ]; then
    echo "Distribution CustomErrorResponses and function association already match desired config — nothing to do."
    exit 0
fi

echo "Updating distribution: CustomErrorResponses + viewer-request function association..."
jq --argjson errorItems "$DESIRED_ERROR_ITEMS" --argjson functionItems "$DESIRED_FUNCTION_ASSOCIATIONS" '
    .DistributionConfig
    | .CustomErrorResponses = {
        "Quantity": ($errorItems | length),
        "Items": $errorItems
      }
    | .DefaultCacheBehavior.FunctionAssociations = {
        "Quantity": ($functionItems | length),
        "Items": $functionItems
      }
' "$CURRENT" > "$NEW_CONFIG"

aws cloudfront update-distribution \
    $PROFILE_FLAG \
    --id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --if-match "$DIST_ETAG" \
    --distribution-config "file://$NEW_CONFIG" \
    --no-cli-pager > /dev/null

echo "Update submitted. CloudFront will propagate the change in a few minutes."
