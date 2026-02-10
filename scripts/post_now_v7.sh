#!/bin/bash

##############################################################################
# Caribbean Tourism Posting - Quick Execution Script
# 
# Usage:
#   ./scripts/post_now_v7.sh              # Post 2 articles to both platforms
#   ./scripts/post_now_v7.sh dry-run      # Test without posting
#   ./scripts/post_now_v7.sh setup        # Setup login sessions
#   ./scripts/post_now_v7.sh substack     # Post to Substack only
#   ./scripts/post_now_v7.sh twitter      # Post to Twitter only
##############################################################################

set -e

cd "$(dirname "$0")/.."

# Default: post 2 articles to both platforms
MODE="${1:-post}"
COUNT="${2:-2}"

case "$MODE" in
    dry-run)
        echo "🔍 DRY RUN MODE - Testing without posting"
        node scripts/post_caribbean_v7.mjs --dry-run --count="$COUNT"
        ;;
    
    setup)
        echo "🔐 SETUP MODE - Configuring login sessions"
        echo ""
        echo "Setting up Substack login..."
        HEADLESS=false node scripts/post_caribbean_v7.mjs --setup-login --platform=substack
        echo ""
        echo "Setting up Twitter login..."
        HEADLESS=false node scripts/post_caribbean_v7.mjs --setup-login --platform=twitter
        echo ""
        echo "✅ Setup complete!"
        ;;
    
    substack)
        echo "📝 Posting to Substack only"
        node scripts/post_caribbean_v7.mjs --count="$COUNT" --platform=substack
        ;;
    
    twitter)
        echo "🐦 Posting to Twitter only"
        node scripts/post_caribbean_v7.mjs --count="$COUNT" --platform=twitter
        ;;
    
    post|*)
        echo "🚀 Posting to both Substack and Twitter"
        node scripts/post_caribbean_v7.mjs --count="$COUNT"
        ;;
esac

echo ""
echo "✅ Done!"
