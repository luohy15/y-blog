#!/bin/bash
set -euo pipefail

# Configure CloudFront CustomErrorResponses for SPA fallback.
# 403/404 from S3 origin -> serve /index.html with HTTP 200 so the
# React Router can render the requested path on the client.
#
# Idempotent: if the desired CustomErrorResponses are already in place,
# the script exits without calling update-distribution.
#
# Required env: CLOUDFRONT_DISTRIBUTION_ID
# Optional env: AWS_PROFILE

if [ -z "${CLOUDFRONT_DISTRIBUTION_ID:-}" ]; then
    echo "Error: CLOUDFRONT_DISTRIBUTION_ID is not set" >&2
    exit 1
fi

PROFILE_FLAG=""
if [ -n "${AWS_PROFILE:-}" ]; then
    PROFILE_FLAG="--profile $AWS_PROFILE"
fi

WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

CURRENT="$WORK_DIR/current.json"
NEW_CONFIG="$WORK_DIR/new-config.json"

echo "Fetching current distribution config for $CLOUDFRONT_DISTRIBUTION_ID..."
aws cloudfront get-distribution-config \
    $PROFILE_FLAG \
    --id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --output json > "$CURRENT"

ETAG=$(jq -r '.ETag' "$CURRENT")

DESIRED_ITEMS='[
    {
        "ErrorCode": 403,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 0
    },
    {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 0
    }
]'

# Compare current CustomErrorResponses items (sorted by ErrorCode) with desired.
CURRENT_ITEMS=$(jq -c '.DistributionConfig.CustomErrorResponses.Items // [] | sort_by(.ErrorCode)' "$CURRENT")
DESIRED_SORTED=$(echo "$DESIRED_ITEMS" | jq -c 'sort_by(.ErrorCode)')

if [ "$CURRENT_ITEMS" = "$DESIRED_SORTED" ]; then
    echo "CustomErrorResponses already match desired config — nothing to do."
    exit 0
fi

echo "Updating CustomErrorResponses..."
jq --argjson items "$DESIRED_ITEMS" '
    .DistributionConfig
    | .CustomErrorResponses = {
        "Quantity": ($items | length),
        "Items": $items
      }
' "$CURRENT" > "$NEW_CONFIG"

aws cloudfront update-distribution \
    $PROFILE_FLAG \
    --id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --if-match "$ETAG" \
    --distribution-config "file://$NEW_CONFIG" \
    --no-cli-pager > /dev/null

echo "Update submitted. CloudFront will propagate the change in a few minutes."
