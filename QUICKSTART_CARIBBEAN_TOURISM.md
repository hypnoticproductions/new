# Caribbean Tourism Syndication - Quick Start Guide

Get your automated Caribbean tourism content posting system up and running in 5 minutes.

## What This System Does

Automatically posts **2 Caribbean tourism articles** to Substack and Twitter at scheduled times:
- **9:00 AM AST** - Posts 1-2
- **1:00 PM AST** - Posts 3-4
- **6:00 PM AST** - Posts 5-6

The system intelligently rotates through 6 pre-written articles, ensuring even distribution and no duplicates.

## Prerequisites

✅ Node.js 18+ installed  
✅ pnpm package manager  
✅ Substack account with publishing access  
✅ Twitter account  

## Step 1: Initial Setup (One-Time)

### Install Dependencies

```bash
cd /home/ubuntu/quintapoo-memory
pnpm install
pnpm exec playwright install chromium
```

This installs Playwright for browser automation.

## Step 2: First Login to Substack (One-Time)

You need to log in to Substack once to save your session:

```bash
HEADLESS=false node scripts/post_caribbean_tourism.mjs --dry-run
```

**What happens:**
1. A browser window opens
2. Navigate to your Substack and log in
3. The script saves your session automatically
4. Close the browser when done

**Your session is now saved!** Future runs won't require login.

## Step 3: Test the System

Run a dry-run to verify everything works:

```bash
node scripts/post_caribbean_tourism.mjs --dry-run
```

**Expected output:**
```
🚀 Caribbean Tourism Content Syndication System
================================================

📄 Parsed 6 posts from content file
📋 Posts scheduled for publishing:
   - Post 1: Caribbean Tourism Shows Strong Recovery in Q1 2026
   - Post 2: Crisis Management for Caribbean Tourism Operators

🔍 DRY RUN MODE - No actual posting will occur

✅ Successfully published Post 1 to both platforms
✅ Successfully published Post 2 to both platforms

📊 Summary:
   Posts published: 2
   Target audience: 320 Caribbean tourism businesses
```

## Step 4: Check Status

View the current rotation status:

```bash
cd scripts
./check_status.sh
```

This shows:
- Which posts have been published
- Next posts in rotation
- Recent posting history
- Platform URLs

## Step 5: Post for Real

When you're ready to post actual content:

```bash
node scripts/post_caribbean_tourism.mjs
```

**This will:**
1. Select the next 2 posts in rotation
2. Post full articles to Substack
3. Post summaries with links to Twitter
4. Update the posting history
5. Show you the published URLs

## Step 6: Schedule Automated Posts

### Option A: Using Cron (Recommended for Servers)

```bash
# Edit crontab
crontab -e

# Add these lines (adjust for your timezone)
0 9 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_tourism.mjs >> logs/caribbean.log 2>&1
0 13 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_tourism.mjs >> logs/caribbean.log 2>&1
0 18 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_tourism.mjs >> logs/caribbean.log 2>&1
```

### Option B: Using GitHub Actions (Recommended for Cloud)

Create `.github/workflows/caribbean-posts.yml`:

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
          node-version: '18'
      - run: |
          npm install -g pnpm
          pnpm install
          pnpm exec playwright install chromium
      - run: node scripts/post_caribbean_tourism.mjs
```

## Common Commands

### Post Now
```bash
node scripts/post_caribbean_tourism.mjs
```

### Test Without Posting
```bash
node scripts/post_caribbean_tourism.mjs --dry-run
```

### Check Status
```bash
cd scripts && ./check_status.sh
```

### View Posting History
```bash
cat scripts/posting_history.json | jq '.history'
```

### Reset Rotation (Start Over)
```bash
rm scripts/posting_history.json
```

### Debug Mode (See Browser)
```bash
HEADLESS=false node scripts/post_caribbean_tourism.mjs --dry-run
```

## Understanding the Rotation

The system uses intelligent rotation:

1. **First Run**: Posts 1 and 2 are published
2. **Second Run**: Posts 3 and 4 are published (1 and 2 were just used)
3. **Third Run**: Posts 5 and 6 are published
4. **Fourth Run**: Back to Posts 1 and 2 (they're the oldest)

This ensures:
- ✅ All 6 posts get equal exposure
- ✅ No post is repeated too frequently
- ✅ Fresh content for your audience

## Editing Content

Edit articles in `content/daily_posts_caribbean_tourism.md`:

```markdown
## Post 1: Your Title

**Title:** Main Title Here

**Subtitle:** Optional subtitle

**Content:**

Your article content...

**Tags:** #CaribbeanTourism #YourTags
```

Changes take effect immediately on the next run.

## Monitoring Success

### Check Substack
1. Go to your Substack dashboard
2. Look for published posts
3. Check views and engagement

### Check Twitter
1. Go to your Twitter profile
2. Look for recent tweets
3. Check likes and retweets

### Check Logs
```bash
tail -f logs/caribbean.log
```

## Troubleshooting

### "Not logged in to Substack"
```bash
# Re-login with visible browser
HEADLESS=false node scripts/post_caribbean_tourism.mjs --dry-run
```

### Script Hangs
```bash
# Increase timeout
TIMEOUT=60000 node scripts/post_caribbean_tourism.mjs
```

### Posts Not Rotating
```bash
# Check status
cd scripts && ./check_status.sh

# Reset if needed
rm posting_history.json
```

### Content Not Parsing
```bash
# Test in dry-run mode
node scripts/post_caribbean_tourism.mjs --dry-run

# Check content file format
cat content/daily_posts_caribbean_tourism.md
```

## Next Steps

1. ✅ Complete initial setup
2. ✅ Test with dry-run
3. ✅ Post your first real articles
4. ✅ Set up automated scheduling
5. ✅ Monitor engagement and adjust content

## Support

- **Full Documentation**: `scripts/README_CARIBBEAN_TOURISM.md`
- **Database Schema**: `scripts/schema.sql` (for production)
- **Status Checker**: `scripts/check_status.sh`

## Tips for Success

### Content Strategy
- Keep articles relevant to Caribbean tourism businesses
- Update content monthly with fresh data
- Use engaging titles and subtitles
- Include actionable insights

### Timing
- 9 AM: Catch morning readers
- 1 PM: Reach lunch-time browsers
- 6 PM: Evening engagement

### Engagement
- Respond to comments on Substack
- Engage with replies on Twitter
- Share posts in relevant groups
- Track which topics perform best

### Maintenance
- Weekly: Check posting history
- Monthly: Update content
- Quarterly: Add new articles

## Success Metrics

Track these to measure impact:

**Substack:**
- Views per post
- Subscriber growth
- Email open rates
- Comment engagement

**Twitter:**
- Impressions
- Likes and retweets
- Profile visits
- Link clicks

**Overall:**
- Leads generated
- Website traffic from posts
- Inquiries from target audience

## Your System is Ready!

You now have a fully automated Caribbean tourism content syndication system that:

✅ Posts 2 articles at scheduled times  
✅ Rotates through 6 articles intelligently  
✅ Tracks posting history automatically  
✅ Publishes to Substack and Twitter  
✅ Targets 320 Caribbean tourism businesses  
✅ Runs autonomously once set up  

**Start posting today!**

```bash
node scripts/post_caribbean_tourism.mjs
```

---

**Questions?** Check `scripts/README_CARIBBEAN_TOURISM.md` for detailed documentation.

**Need help?** Run `./scripts/check_status.sh` to diagnose issues.

**Ready to scale?** See the README for adding more platforms and articles.
