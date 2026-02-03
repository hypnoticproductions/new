# Caribbean Tourism Content Syndication Guide

## Overview

This system automatically posts 2 Caribbean tourism articles to **Substack** and **Twitter** at scheduled times throughout the day. The system includes:

- ✅ 6 high-quality Caribbean tourism posts
- ✅ Smart rotation system (avoids duplicates)
- ✅ Posting history tracking
- ✅ Browser automation with Playwright
- ✅ Session persistence for hands-free operation

## Target Audience

**320 Caribbean tourism businesses** across the region

## Posting Schedule

The system is designed to post **3 times per day**:

1. **9:00 AM AST** - Posts 1-2
2. **1:00 PM AST** - Posts 3-4  
3. **6:00 PM AST** - Posts 5-6

Each run posts **2 articles** (one to Substack, then shared to Twitter with link).

## Content Rotation

The system automatically rotates through 6 posts:

| Post # | Title | Status |
|--------|-------|--------|
| 1 | Caribbean Tourism Shows Strong Recovery in Q1 2026 | Ready |
| 2 | Hurricane Season 2026: Essential Crisis Communication Strategies | Ready |
| 3 | Social Media ROI: Which Platforms Drive Caribbean Tourism Bookings? | Posted |
| 4 | Why Eco-Certification Increases Caribbean Tourism Revenue by 31% | Posted |
| 5 | Solving the Caribbean Tourism Labor Shortage: Strategies That Work | Posted |
| 6 | 2026 Tourism Technology: Essential Tools for Caribbean Operators | Posted |

**Rotation Logic:** Posts are selected based on:
1. Never posted > Least posted > Oldest post date
2. Ensures even distribution across all 6 posts

## One-Time Setup

### Step 1: Install Dependencies

```bash
cd /home/ubuntu/quintapoo-memory
npm install
npx playwright install chromium
```

### Step 2: Set Up Substack Session

Run the session setup script to log in once:

```bash
node scripts/setup_substack_session.mjs
```

**Instructions:**
1. Browser window will open
2. Log in to Substack manually
3. Navigate to your publisher dashboard
4. Press Enter in the terminal
5. Session will be saved to `~/.substack-session.json`

**Note:** Twitter session is already configured and working.

### Step 3: Test the System

Run a dry-run to verify everything works:

```bash
node scripts/post_caribbean_tourism.mjs --dry-run
```

Expected output:
- ✅ Substack login verified
- ✅ Twitter login verified
- ✅ 2 posts selected for publishing
- ✅ Content preview shown

## Running the Posting Script

### Manual Posting

Post the next 2 articles immediately:

```bash
cd /home/ubuntu/quintapoo-memory
node scripts/post_caribbean_tourism.mjs
```

### Dry Run (Test Mode)

Preview what would be posted without actually posting:

```bash
node scripts/post_caribbean_tourism.mjs --dry-run
```

### Headless Mode (Default)

The script runs in headless mode by default (no visible browser). To see the browser:

```bash
HEADLESS=false node scripts/post_caribbean_tourism.mjs
```

## Automated Scheduling

### Option 1: Using cron-job.org (Recommended)

Set up 3 scheduled tasks at **cron-job.org**:

**Task 1: Morning Posts (9:00 AM AST)**
- Schedule: `0 9 * * *` (Atlantic Time)
- Command: `cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_tourism.mjs`

**Task 2: Afternoon Posts (1:00 PM AST)**
- Schedule: `0 13 * * *` (Atlantic Time)
- Command: `cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_tourism.mjs`

**Task 3: Evening Posts (6:00 PM AST)**
- Schedule: `0 18 * * *` (Atlantic Time)
- Command: `cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_tourism.mjs`

### Option 2: Using System Cron

Add to crontab (`crontab -e`):

```bash
# Caribbean Tourism Posting (Atlantic Time = UTC-4)
0 13 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_tourism.mjs >> /tmp/caribbean_posting.log 2>&1
0 17 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_tourism.mjs >> /tmp/caribbean_posting.log 2>&1
0 22 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_tourism.mjs >> /tmp/caribbean_posting.log 2>&1
```

**Note:** Times adjusted for UTC (AST is UTC-4)

## Monitoring & Tracking

### Check Posting History

```bash
cat /home/ubuntu/quintapoo-memory/scripts/posting_history.json
```

### View Logs

If using cron:

```bash
tail -f /tmp/caribbean_posting.log
```

### Check Next Posts in Queue

Run a dry-run to see which posts are next:

```bash
node scripts/post_caribbean_tourism.mjs --dry-run | grep "Posts scheduled"
```

## Troubleshooting

### Issue: "Not logged in to Substack"

**Solution:** Re-run the session setup:

```bash
node scripts/setup_substack_session.mjs
```

### Issue: "Not logged in to Twitter"

**Solution:** Twitter uses system browser cookies. Log in to Twitter in your regular browser, then the script will use those cookies.

### Issue: Script hangs or times out

**Solution:** Run with visible browser to debug:

```bash
HEADLESS=false node scripts/post_caribbean_tourism.mjs --dry-run
```

### Issue: Posts not rotating correctly

**Solution:** Check posting history:

```bash
cat scripts/posting_history.json | grep -A 3 '"posts"'
```

## File Structure

```
quintapoo-memory/
├── content/
│   └── daily_posts_caribbean_tourism.md    # 6 Caribbean tourism posts
├── scripts/
│   ├── post_caribbean_tourism.mjs          # Main posting script
│   ├── setup_substack_session.mjs          # One-time login helper
│   └── posting_history.json                # Rotation tracking database
└── CARIBBEAN_TOURISM_POSTING_GUIDE.md      # This guide
```

## Session Files

- `~/.substack-session.json` - Substack login cookies
- System browser cookies used for Twitter

## Script Features

### Smart Rotation
- Tracks post count for each article
- Prioritizes least-posted content
- Prevents duplicate posting in same session

### Error Handling
- Graceful failure (logs errors, continues)
- Session persistence across runs
- Automatic retry logic

### Flexible Configuration
- Dry-run mode for testing
- Headless/visible browser modes
- Configurable timeouts
- Environment variable support

## Success Metrics

After each run, the script reports:

- ✅ Number of posts published
- ✅ Target audience reached
- ✅ Total posting history count
- ✅ Next posts in rotation queue

## Next Steps

1. ✅ Complete one-time Substack login setup
2. ✅ Run test posting (dry-run)
3. ✅ Set up automated scheduling (cron-job.org)
4. ✅ Monitor first few automated runs
5. ✅ Review engagement metrics on platforms

## Support

For issues or questions:
- Check the troubleshooting section above
- Review posting history: `scripts/posting_history.json`
- Run in debug mode: `HEADLESS=false node scripts/post_caribbean_tourism.mjs --dry-run`

---

**Last Updated:** February 3, 2026  
**System Status:** ✅ Operational (Twitter logged in, Substack requires one-time setup)
