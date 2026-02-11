#!/bin/bash

# Caribbean Tourism Posting Script - Quick Launcher
# Posts 2 Caribbean tourism articles to Substack and Twitter

cd "$(dirname "$0")/.."

echo "🏝️  WUKR Wire Caribbean Tourism Syndication"
echo "Target: 320 Caribbean tourism businesses"
echo ""

# Check for arguments
if [ "$1" == "--dry-run" ]; then
    echo "Running in DRY RUN mode (no actual posting)"
    node scripts/post_caribbean_tourism_now.mjs --dry-run
elif [ "$1" == "--help" ]; then
    echo "Usage: ./post_caribbean.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --dry-run              Test run without actually posting"
    echo "  --count=N              Number of posts to publish (default: 2)"
    echo "  --platform=P1,P2       Platforms to post to (default: substack,twitter)"
    echo "  --help                 Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./post_caribbean.sh                           # Post 2 articles to both platforms"
    echo "  ./post_caribbean.sh --dry-run                 # Test without posting"
    echo "  ./post_caribbean.sh --count=1                 # Post only 1 article"
    echo "  ./post_caribbean.sh --platform=substack       # Post to Substack only"
else
    node scripts/post_caribbean_tourism_now.mjs "$@"
fi
