# Caribbean Tourism Content Syndication - Complete Setup Guide

## Overview

This system automatically posts **2 Caribbean tourism articles** to Substack and Twitter at scheduled times throughout the day, targeting **320 Caribbean tourism businesses**.

**Posting Schedule:**
- **9:00 AM AST** - Posts 1-2
- **1:00 PM AST** - Posts 3-4  
- **6:00 PM AST** - Posts 5-6

The system intelligently rotates through 6 pre-written articles, ensuring even distribution and preventing duplicates.

## Quick Start

### 1. Initial Setup (One-Time)

```bash
cd /home/ubuntu/quintapoo-memory
pnpm install
npx playwright install chromium
```

### 2. Login to Platforms (One-Time)

You need to log in once to save your session cookies:

```bash
# Run with visible browser
HEADLESS=false node scripts/post_caribbean_tourism_v2.mjs --dry-run
```

When the browsers open:
1. **Substack**: Navigate to https://richarddannibarrifortune.substack.com and log in
2. **Twitter**: Navigate to https://x.com and log in
3. The script will save your sessions automatically

### 3. Test the System

```bash
# Dry run (no actual posting)
node scripts/post_caribbean_tourism_v2.mjs --dry-run

# Real posting (after login)
node scripts/post_caribbean_tourism_v2.mjs
```

## Scheduling Options

### Option 1: Using Manus Schedule Tool (Recommended)

The system can be scheduled to run automatically 3 times daily:

```
9:00 AM AST (13:00 UTC) - Posts 1-2
1:00 PM AST (17:00 UTC) - Posts 3-4
6:00 PM AST (22:00 UTC) - Posts 5-6
```

### Option 2: Using cron-job.org

1. Go to https://cron-job.org
2. Create a new cron job with these settings:
   - **Title**: Caribbean Tourism Posts - Morning
   - **URL**: Your webhook endpoint
   - **Schedule**: `0 13 * * *` (9 AM AST)
   - Repeat for 1 PM and 6 PM slots

3. Set up webhook to trigger:
```bash
cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_tourism_v2.mjs
```

### Option 3: GitHub Actions (If repo is on GitHub)

Create `.github/workflows/caribbean-tourism-posts.yml`:

```yaml
name: Caribbean Tourism Posts

on:
  schedule:
    - cron: '0 13 * * *'  # 9 AM AST
    - cron: '0 17 * * *'  # 1 PM AST
    - cron: '0 22 * * *'  # 6 PM AST
  workflow_dispatch:

jobs:
  post:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - name: Install dependencies
        run: |
          npm install -g pnpm
          pnpm install
          npx playwright install chromium
      - name: Post articles
        run: node scripts/post_caribbean_tourism_v2.mjs
        env:
          HEADLESS: true
```

## Content Management

### Viewing Current Posts

All 6 posts are stored in: `content/daily_posts_caribbean_tourism.md`

**Current Posts:**
1. Caribbean Tourism Recovery Trends
2. Crisis Management for Caribbean Tourism Operators
3. Digital Marketing Strategies for Caribbean Tourism
4. Why Eco-Certification Increases Caribbean Tourism Revenue by 31%
5. Solving the Caribbean Tourism Labor Shortage
6. 2026 Tourism Technology: Essential Tools for Caribbean Operators

### Editing Posts

Edit the content file directly:

```bash
nano content/daily_posts_caribbean_tourism.md
```

Format:
```markdown
## Post 1: Your Title Here

**Title:** Main Title

**Subtitle:** Optional subtitle

**Content:**

Your article content here...

**Tags:** #CaribbeanTourism #YourTags
```

Changes take effect immediately on the next run.

### Adding New Posts

To expand beyond 6 posts:

1. Add new posts to `daily_posts_caribbean_tourism.md` following the same format
2. Update the database initialization in the script if needed
3. The rotation logic will automatically include new posts

## Monitoring & Tracking

### Check Posting History

```bash
# View all posting records
cat scripts/posting_history.json | jq '.history'

# View post rotation status
cat scripts/posting_history.json | jq '.posts'

# See which posts are next
node scripts/post_caribbean_tourism_v2.mjs --dry-run | grep "Next posts"
```

### Posting History Format

```json
{
  "posts": [
    {
      "id": 1,
      "postNumber": 1,
      "title": "Post 1",
      "lastPostedAt": "2026-02-03T13:09:16.157Z",
      "postCount": 4,
      "substackUrl": "https://...",
      "twitterUrl": "https://..."
    }
  ],
  "history": [
    {
      "postId": 1,
      "platform": "substack",
      "url": "https://...",
      "status": "success",
      "postedAt": "2026-02-03T13:09:16.157Z"
    }
  ]
}
```

## Rotation Logic

The system automatically selects posts based on:

1. **Never posted** - Posts that have never been published get priority
2. **Least posted** - Posts with the lowest post count
3. **Oldest** - Posts with the oldest `lastPostedAt` timestamp
4. **Post number** - Tiebreaker using post number (1-6)

This ensures all 6 posts are rotated evenly before any post is repeated.

## Troubleshooting

### Session Expired

**Symptom**: "Not logged in" errors

**Solution**:
```bash
HEADLESS=false node scripts/post_caribbean_tourism_v2.mjs --dry-run
```
Log in manually when the browser opens.

### Script Hangs

**Symptom**: Script doesn't complete

**Solution**:
1. Run with visible browser to see what's happening:
```bash
HEADLESS=false node scripts/post_caribbean_tourism_v2.mjs --dry-run
```
2. Check if Substack/Twitter UI has changed
3. Update selectors in the script if needed

### Wrong Posts Being Published

**Symptom**: Same posts repeating or wrong rotation order

**Solution**:
```bash
# Check posting history
cat scripts/posting_history.json | jq '.posts'

# Reset rotation (if needed)
rm scripts/posting_history.json
node scripts/post_caribbean_tourism_v2.mjs --dry-run
```

### Playwright Browser Issues

**Symptom**: Browser executable not found

**Solution**:
```bash
cd /home/ubuntu/quintapoo-memory
npx playwright install chromium
```

## Advanced Configuration

### Environment Variables

```bash
# Show browser (for debugging)
export HEADLESS=false

# Increase timeout (if slow connection)
export TIMEOUT=60000

# Dry run mode
node scripts/post_caribbean_tourism_v2.mjs --dry-run
```

### Script Options

```bash
# Dry run (test without posting)
node scripts/post_caribbean_tourism_v2.mjs --dry-run

# Skip login check (if you know you're logged in)
node scripts/post_caribbean_tourism_v2.mjs --skip-login-check

# Visible browser + dry run
HEADLESS=false node scripts/post_caribbean_tourism_v2.mjs --dry-run
```

## Files Structure

```
quintapoo-memory/
├── content/
│   └── daily_posts_caribbean_tourism.md    # 6 pre-written articles
├── scripts/
│   ├── post_caribbean_tourism_v2.mjs       # Main posting script (improved)
│   ├── post_caribbean_tourism.mjs          # Original script (backup)
│   └── posting_history.json                # Rotation tracking database
└── .substack-session.json                  # Saved Substack login (in home dir)
```

## Integration with GitHub

The repository is already connected to GitHub at `hypnoticproductions/new`.

To push updates:

```bash
cd /home/ubuntu/quintapoo-memory
git add .
git commit -m "Update Caribbean tourism content"
git push origin main
```

## Success Metrics

**Target Audience**: 320 Caribbean tourism businesses

**Expected Results**:
- 6 posts published per day (2 posts × 3 time slots)
- Even rotation across all 6 articles
- Consistent posting schedule
- Engagement tracking via Substack and Twitter analytics

## Next Steps

1. ✅ **Complete initial login** to both platforms
2. ✅ **Test with dry-run** to verify everything works
3. ✅ **Run first real posting** manually
4. ✅ **Set up scheduling** using preferred method (Manus, cron-job.org, or GitHub Actions)
5. ✅ **Monitor results** via posting history and platform analytics

## Support

For issues or questions:
- Check the troubleshooting section above
- Review the posting history: `cat scripts/posting_history.json`
- Run in dry-run mode to test: `node scripts/post_caribbean_tourism_v2.mjs --dry-run`
- Check GitHub repo: `hypnoticproductions/new`

---

**Last Updated**: February 3, 2026  
**Version**: 2.0  
**Status**: Ready for production use
