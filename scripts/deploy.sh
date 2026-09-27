#!/bin/bash
set -e

AWS_PROFILE=${AWS_PROFILE:-}
PROFILE_FLAG=""
if [ -n "$AWS_PROFILE" ]; then
    PROFILE_FLAG="--profile $AWS_PROFILE"
fi

STATIC_DIR="dist"

if [ ! -d "$STATIC_DIR" ]; then
    echo "Error: dist directory not found. Run 'npm run build' first."
    exit 1
fi

echo "Deploying to S3 bucket: $WEB_BUCKET_NAME"

# Sync non-HTML files with long cache
aws s3 sync "$STATIC_DIR" "s3://$WEB_BUCKET_NAME" \
    $PROFILE_FLAG \
    --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "*.html" \
    --exclude "*.txt" \
    --exclude "*.xml"

# Sync HTML files with short cache
aws s3 sync "$STATIC_DIR" "s3://$WEB_BUCKET_NAME" \
    $PROFILE_FLAG \
    --delete \
    --cache-control "public, max-age=3600" \
    --include "*.html" \
    --include "*.txt" \
    --include "*.xml"

echo "Static files deployed!"

# Invalidate CloudFront cache
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo "Invalidating CloudFront cache..."
    aws cloudfront create-invalidation \
        $PROFILE_FLAG \
        --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
        --paths "/*" \
        --no-cli-pager
    echo "CloudFront cache invalidation started"
fi
