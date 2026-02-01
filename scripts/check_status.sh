#!/bin/bash

# Caribbean Tourism Posting Status Checker
# Shows current rotation status and posting history

echo "================================================"
echo "Caribbean Tourism Syndication Status"
echo "================================================"
echo ""

# Check if posting history exists
if [ ! -f "posting_history.json" ]; then
    echo "❌ No posting history found"
    echo "   Run the script at least once to initialize"
    exit 1
fi

echo "📊 POSTING STATISTICS"
echo "--------------------"

# Count total posts
total_posts=$(jq '.posts | length' posting_history.json)
echo "Total posts in rotation: $total_posts"

# Count published posts
published_count=$(jq '[.posts[] | select(.postCount > 0)] | length' posting_history.json)
echo "Posts that have been published: $published_count"

# Count total posting attempts
total_attempts=$(jq '.history | length' posting_history.json)
echo "Total posting attempts: $total_attempts"

# Count successful posts
successful=$(jq '[.history[] | select(.status == "success")] | length' posting_history.json)
echo "Successful posts: $successful"

# Count failed posts
failed=$(jq '[.history[] | select(.status == "failed")] | length' posting_history.json)
echo "Failed posts: $failed"

echo ""
echo "📋 POST ROTATION STATUS"
echo "----------------------"

# Show each post's status
jq -r '.posts[] | "Post \(.postNumber): \(.title // "Untitled") - Posted \(.postCount) times, Last: \(.lastPostedAt // "Never")"' posting_history.json

echo ""
echo "🔄 NEXT POSTS TO PUBLISH"
echo "------------------------"

# Get next 2 posts (simulate the rotation logic)
jq -r '[.posts | sort_by(.lastPostedAt // "1970-01-01", .postCount, .postNumber) | .[0:2][] | "Post \(.postNumber): \(.title // "Untitled")"]' posting_history.json

echo ""
echo "📅 RECENT POSTING HISTORY"
echo "-------------------------"

# Show last 5 posting attempts
jq -r '.history[-5:] | reverse[] | "\(.postedAt) - Post \(.postId) to \(.platform): \(.status)"' posting_history.json

echo ""
echo "🔗 PLATFORM URLS"
echo "----------------"

# Show URLs for posts that have been published
jq -r '.posts[] | select(.substackUrl != null or .twitterUrl != null) | "Post \(.postNumber):\n  Substack: \(.substackUrl // "Not posted")\n  Twitter: \(.twitterUrl // "Not posted")"' posting_history.json

echo ""
echo "================================================"
