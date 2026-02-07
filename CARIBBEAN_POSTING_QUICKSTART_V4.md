# Caribbean Tourism Content Syndication System V4 - Quick Start Guide

## Overview

Automated content syndication system that posts Caribbean tourism content to **Substack** and **Twitter** with intelligent rotation and duplicate tracking.

**Target:** 320 Caribbean tourism businesses  
**Content:** 6 high-quality tourism posts  
**Schedule:** 3 times daily (9 AM, 1 PM, 6 PM AST)  
**Platforms:** Substack (primary), Twitter (secondary)

---

## Features

✅ **Intelligent Rotation** - Automatically cycles through 6 posts, prioritizing least-posted content  
✅ **Duplicate Prevention** - JSON-based tracking prevents re-posting same content  
✅ **Session Persistence** - Saves login sessions for autonomous operation  
✅ **Multi-Platform** - Posts to Substack first, then Twitter with link back  
✅ **Twitter Threads** - Automatically formats long content into Twitter threads  
✅ **Error Recovery** - Continues posting even if one platform fails  
✅ **Detailed Logging** - Tracks all posting activity with timestamps and URLs

---

## Quick Start (3 Steps)

### Step 1: Setup Login Sessions (One-Time)

Run this command to save your login credentials for autonomous posting:

```bash
cd /home/ubuntu/quintapoo-memory
node scripts/post_caribbean_now_v4.mjs --setup-login --platforms=substack,twitter
```

This will:
1. Open a browser window for Substack
2. Wait 60 seconds for you to log in manually
3. Save your session to `~/.substack-session.json`
4. Repeat for Twitter (saves to `~/.twitter-session.json`)

**Important:** You only need to do this once. Sessions persist across runs.

### Step 2: Test Posting (Dry Run)

Test the system without actually posting:

```bash
node scripts/post_caribbean_now_v4.mjs --dry-run --count=2
```

This will:
- Show which posts would be published
- Display rotation logic
- Verify content parsing
- No actual posting occurs

### Step 3: Post Your First 2 Articles

```bash
node scripts/post_caribbean_now_v4.mjs --count=2
```

This will:
1. Select the next 2 posts based on rotation logic
2. Post to Substack first
3. Post to Twitter with Substack link
4. Update posting history
5. Display URLs for verification

---

## Automated Scheduling

### Install Cron Jobs for Daily Posting

```bash
./scripts/schedule_caribbean_v4.sh install
```

This creates 3 daily cron jobs:
- **9:00 AM AST** (1 PM UTC): Posts 1-2
- **1:00 PM AST** (5 PM UTC): Posts 3-4
- **6:00 PM AST** (10 PM UTC): Posts 5-6

### Check Schedule Status

```bash
./scripts/schedule_caribbean_v4.sh status
```

Shows:
- Active cron jobs
- Recent log entries
- Last posting times

### Remove Cron Jobs

```bash
./scripts/schedule_caribbean_v4.sh remove
```

---

## Command Reference

### Posting Script Options

```bash
node scripts/post_caribbean_now_v4.mjs [OPTIONS]
```

**Options:**
- `--dry-run` - Test mode, no actual posting
- `--setup-login` - Save login sessions for Substack and Twitter
- `--count=N` - Number of posts to publish (default: 2)
- `--platforms=substack,twitter` - Which platforms to post to
- `--headless=false` - Show browser window (useful for debugging)

**Examples:**

```bash
# Post only to Substack
node scripts/post_caribbean_now_v4.mjs --platforms=substack --count=2

# Post only to Twitter
node scripts/post_caribbean_now_v4.mjs --platforms=twitter --count=2

# Post 4 articles at once
node scripts/post_caribbean_now_v4.mjs --count=4

# Debug mode (show browser)
HEADLESS=false node scripts/post_caribbean_now_v4.mjs --count=2
```

---

## Content Management

### Content File Location

```
/home/ubuntu/quintapoo-memory/content/daily_posts_caribbean_tourism.md
```

### Content Format

Each post follows this structure:

```markdown
## Post 1: Caribbean Tourism Recovery Trends

**Title:** Caribbean Tourism Shows Strong Recovery in Q1 2026

**Subtitle:** Regional arrivals up 23% compared to 2025

**Content:**

[Full article content here...]

**Sources:** Caribbean Tourism Organization (CTO), WTTC

**Tags:** #CaribbeanTourism #TravelTrends #DigitalNomads
```

### Adding New Posts

1. Edit `content/daily_posts_caribbean_tourism.md`
2. Add new post following the format above
3. Use `## Post N:` as the section header
4. Script will automatically parse and rotate through all posts

---

## Posting History & Rotation Logic

### How Rotation Works

The system uses intelligent rotation to ensure fair distribution:

1. **Never posted** - Posts that have never been published get priority
2. **Least posted** - Posts with lowest post count come next
3. **Oldest first** - Posts not published recently get priority
4. **Sequential** - If all else is equal, goes by post number

### Viewing Posting History

```bash
cat scripts/posting_history.json
```

**Example:**

```json
{
  "posts": [
    {
      "id": 1,
      "postNumber": 1,
      "title": "Post 1",
      "lastPostedAt": "2026-02-07T14:30:00.000Z",
      "postCount": 2,
      "substackUrl": "https://richarddannibarrifortune.substack.com/p/post-1",
      "twitterUrl": "https://x.com/username/status/123456789"
    }
  ],
  "history": [
    {
      "postNumber": 1,
      "platform": "substack",
      "url": "https://richarddannibarrifortune.substack.com/p/post-1",
      "postedAt": "2026-02-07T14:30:00.000Z",
      "status": "success"
    }
  ]
}
```

### Reset Posting History

To start fresh (all posts marked as never posted):

```bash
rm scripts/posting_history.json
node scripts/post_caribbean_now_v4.mjs --dry-run
```

This will reinitialize the database with clean state.

---

## Troubleshooting

### Session Expired

**Symptom:** Error message "Not logged in to Substack/Twitter"

**Solution:**
```bash
node scripts/post_caribbean_now_v4.mjs --setup-login
```

Re-login and save new session.

### Browser Won't Launch

**Symptom:** "Failed to launch browser"

**Solution:**
```bash
cd /home/ubuntu/quintapoo-memory
pnpm install playwright
npx playwright install chromium
```

### Content Not Parsing

**Symptom:** "Post N not found in content file"

**Solution:**
1. Check content file exists: `ls -la content/daily_posts_caribbean_tourism.md`
2. Verify format matches expected structure
3. Run dry-run to see parsing output: `node scripts/post_caribbean_now_v4.mjs --dry-run`

### Posting Failed

**Symptom:** "Failed to post to Substack/Twitter"

**Solution:**
1. Check logs: `tail -f logs/caribbean_*.log`
2. Run with visible browser: `HEADLESS=false node scripts/post_caribbean_now_v4.mjs --count=1`
3. Verify login session is valid
4. Check internet connection

---

## Logs & Monitoring

### Log Files

All posting activity is logged to:

```
logs/caribbean_9am.log   - 9 AM AST posts
logs/caribbean_1pm.log   - 1 PM AST posts
logs/caribbean_6pm.log   - 6 PM AST posts
```

### View Real-Time Logs

```bash
# Watch all logs
tail -f logs/caribbean_*.log

# Watch specific time slot
tail -f logs/caribbean_9am.log
```

### Log Format

```
🚀 WUKR Wire Caribbean Tourism Syndication System V4
============================================================
📅 Started at: 2/7/2026, 9:00:00 AM
🎯 Target: 320 Caribbean tourism businesses
📊 Posts to publish: 2
🌐 Platforms: substack, twitter
============================================================

📋 Posts selected for publishing:
   - Post 1: Caribbean Tourism Shows Strong Recovery (posted 0 times)
   - Post 2: Hurricane Season Crisis Communication (posted 0 times)

============================================================
📝 Publishing Post 1: Caribbean Tourism Shows Strong Recovery
============================================================
📝 Posting to Substack: Caribbean Tourism Shows Strong Recovery
✅ Posted to Substack: https://richarddannibarrifortune.substack.com/p/post-1
🐦 Posting to Twitter: Caribbean Tourism Shows Strong Recovery
✅ Posted to Twitter: https://x.com/username/status/123456789
💾 Saved posting history
```

---

## Architecture

### Components

1. **ContentParser** - Extracts posts from Markdown file
2. **PostingDatabase** - JSON-based tracking with rotation logic
3. **TwitterFormatter** - Converts long-form to Twitter threads
4. **SubstackPoster** - Browser automation for Substack
5. **TwitterPoster** - Browser automation for Twitter

### Data Flow

```
Content File (MD)
    ↓
ContentParser (parse posts)
    ↓
PostingDatabase (select next posts)
    ↓
SubstackPoster (post to Substack)
    ↓
TwitterPoster (post to Twitter with Substack link)
    ↓
PostingDatabase (update history)
    ↓
JSON File (persist state)
```

### Session Management

- **Substack Session:** `~/.substack-session.json`
- **Twitter Session:** `~/.twitter-session.json`
- **Posting History:** `scripts/posting_history.json`

Sessions include:
- Cookies
- Local storage
- Session storage
- Authentication tokens

---

## Best Practices

### 1. Test Before Scheduling

Always run a dry-run before installing cron jobs:

```bash
node scripts/post_caribbean_now_v4.mjs --dry-run --count=2
```

### 2. Monitor First Week

Check logs daily for the first week to ensure smooth operation:

```bash
./scripts/schedule_caribbean_v4.sh status
```

### 3. Refresh Sessions Monthly

Login sessions may expire. Refresh them monthly:

```bash
node scripts/post_caribbean_now_v4.mjs --setup-login
```

### 4. Backup Posting History

Backup your posting history weekly:

```bash
cp scripts/posting_history.json scripts/posting_history_backup_$(date +%Y%m%d).json
```

### 5. Update Content Regularly

Keep content fresh by updating the content file:

```bash
vim content/daily_posts_caribbean_tourism.md
```

---

## Advanced Usage

### Custom Posting Schedule

Edit cron jobs manually:

```bash
crontab -e
```

Example: Post every 4 hours:

```cron
0 */4 * * * cd /home/ubuntu/quintapoo-memory && /usr/bin/node scripts/post_caribbean_now_v4.mjs --count=1 >> logs/caribbean_hourly.log 2>&1
```

### Integration with Other Systems

The script exports all classes for programmatic use:

```javascript
import { ContentParser, PostingDatabase, SubstackPoster, TwitterPoster } from './scripts/post_caribbean_now_v4.mjs';

// Custom workflow
const parser = new ContentParser('./content/daily_posts_caribbean_tourism.md');
await parser.parse();

const db = new PostingDatabase();
await db.load();

const posts = db.getNextPostsToPublish(1);
// ... custom logic
```

### Environment Variables

```bash
# Run in non-headless mode (show browser)
HEADLESS=false node scripts/post_caribbean_now_v4.mjs

# Custom timeout (in milliseconds)
TIMEOUT=120000 node scripts/post_caribbean_now_v4.mjs
```

---

## Support & Maintenance

### Regular Maintenance Tasks

**Weekly:**
- Check posting logs
- Verify all posts are rotating correctly
- Monitor engagement on Substack and Twitter

**Monthly:**
- Refresh login sessions
- Backup posting history
- Update content with new posts
- Review and optimize posting times

**Quarterly:**
- Analyze posting analytics
- Update content strategy
- Optimize Twitter thread formatting
- Review and update tags/hashtags

---

## Success Metrics

Track these metrics to measure success:

### Posting Metrics
- ✅ Posts published per day: 6 (target)
- ✅ Platforms reached: 2 (Substack + Twitter)
- ✅ Rotation fairness: All 6 posts posted equally
- ✅ Success rate: >95% (check logs)

### Engagement Metrics (Track Manually)
- Substack views per post
- Substack subscribers gained
- Twitter impressions per thread
- Twitter engagement rate
- Click-through rate from Twitter to Substack

### Audience Growth
- Target: 320 Caribbean tourism businesses
- Track: Followers, subscribers, email list growth

---

## Next Steps

1. ✅ **Setup login sessions** - Run `--setup-login`
2. ✅ **Test posting** - Run with `--dry-run` first
3. ✅ **Post first batch** - Run `--count=2` manually
4. ✅ **Install schedule** - Run `./scripts/schedule_caribbean_v4.sh install`
5. ✅ **Monitor logs** - Check daily for first week
6. ✅ **Optimize content** - Update based on engagement

---

## Questions?

For issues or questions:
1. Check logs: `tail -f logs/caribbean_*.log`
2. Run dry-run: `node scripts/post_caribbean_now_v4.mjs --dry-run`
3. Review posting history: `cat scripts/posting_history.json`
4. Test with visible browser: `HEADLESS=false node scripts/post_caribbean_now_v4.mjs`

---

**Built by WUKR Wire Intelligence**  
**Targeting 320 Caribbean Tourism Businesses**  
**Automated. Intelligent. Relentless.**
