# Caribbean Tourism Content Syndication System v5

**WUKR Wire Daily Dispatch - Autonomous Multi-Platform Posting**

## Overview

Automated content syndication system that posts 6 Caribbean tourism articles to Substack and Twitter, rotating through content intelligently to avoid duplicates and maximize reach to 320 Caribbean tourism businesses.

## System Architecture

### Components

1. **Content Source**: `content/daily_posts_caribbean_tourism.md`
   - 6 professionally written Caribbean tourism articles
   - Topics: Recovery trends, crisis management, digital marketing, sustainability, workforce, technology

2. **Posting Database**: `scripts/posting_history.json`
   - JSON-based tracking (no external database required)
   - Tracks posting history, rotation, and platform URLs
   - Intelligent rotation algorithm prioritizes least-posted content

3. **Main Script**: `scripts/post_caribbean_now_v5.mjs`
   - Browser automation using Playwright
   - Session persistence for autonomous operation
   - Multi-platform support (Substack, Twitter)
   - Twitter thread support for long content
   - Error handling and recovery

4. **Scheduler**: `scripts/schedule_caribbean_v5.sh`
   - Cron-based automation
   - 3 daily posting slots (9 AM, 1 PM, 6 PM AST)
   - Automatic log rotation

## Features

✅ **Intelligent Rotation**: Never posts the same content twice in a row  
✅ **Session Persistence**: Login once, run autonomously forever  
✅ **Duplicate Prevention**: JSON database tracks all posting history  
✅ **Twitter Threads**: Automatically creates threads for long content  
✅ **Multi-Platform**: Substack (long-form) + Twitter (engagement)  
✅ **Error Recovery**: Graceful failure handling, continues on errors  
✅ **Dry-Run Mode**: Test without posting  
✅ **Detailed Logging**: Track every post with timestamps and URLs  

## Quick Start

### 1. Initialize Database

```bash
cd /home/ubuntu/quintapoo-memory
node scripts/initialize_posts_db.mjs
```

**Output:**
```
📊 Found existing database
📖 Reading content file...
✅ Parsed 6 posts
💾 Database initialized successfully
   Posts: 6
   History records: 56
```

### 2. Set Up Login Sessions (One-Time)

This is the **only manual step**. You need to log in once to save browser sessions.

```bash
node scripts/post_caribbean_now_v5.mjs --setup-login
```

**What happens:**
1. Browser windows open for Substack and Twitter
2. You manually log in to each platform
3. Sessions are saved to `~/.substack-session.json` and `~/.twitter-session.json`
4. Future runs use these sessions automatically

**Important:** Keep these session files secure. They contain your login credentials.

### 3. Test Posting (Dry Run)

```bash
node scripts/post_caribbean_now_v5.mjs --dry-run --count=2
```

**Output:**
```
🚀 Caribbean Tourism Content Syndication - WUKR Wire Daily Dispatch v5
📅 2/9/2026, 6:07:18 PM AST
🎯 Target: 320 Caribbean tourism businesses
📊 Platforms: substack, twitter
📝 Posts to publish: 2
🧪 DRY RUN MODE - No actual posting will occur

📋 Posts to publish:
   1. Post 6: 2026 Tourism Technology: Essential Tools for Caribbean Operators
      Last posted: Never (0 times)
   2. Post 5: Solving the Caribbean Tourism Labor Shortage: Strategies That Work
      Last posted: 2026-02-06T13:07:21.370Z (8 times)
```

### 4. Post Now (Manual)

```bash
node scripts/post_caribbean_now_v5.mjs --count=2
```

This will:
- Select the next 2 posts based on rotation logic
- Post to Substack (long-form article)
- Post to Twitter (thread with link to Substack)
- Update database with URLs and timestamps

### 5. Enable Automated Posting

```bash
./scripts/schedule_caribbean_v5.sh install
```

**Output:**
```
📅 Installing Caribbean Tourism posting schedule...
✅ Cron jobs installed successfully!

📋 Schedule:
   9:00 AM AST - Posts 1-2
   1:00 PM AST - Posts 3-4
   6:00 PM AST - Posts 5-6

📊 Logs will be saved to: /home/ubuntu/quintapoo-memory/logs/
```

## Posting Schedule

| Time (AST) | Posts | Target Audience |
|------------|-------|-----------------|
| 9:00 AM    | 2 posts | Morning readers, business owners starting their day |
| 1:00 PM    | 2 posts | Lunch break, mid-day social media users |
| 6:00 PM    | 2 posts | Evening readers, end-of-day planners |

**Total:** 6 posts per day, rotating through all 6 articles

## Rotation Logic

The system intelligently selects which posts to publish based on:

1. **Never posted before** (highest priority)
2. **Least posted count** (balance posting frequency)
3. **Oldest last posted date** (ensure fresh rotation)
4. **Sequential order** (fallback for ties)

**Example:**
- Post 6 has never been posted → **Selected first**
- Post 5 posted 8 times (least) → **Selected second**
- Posts 1-4 posted 9 times each → **Wait for next rotation**

## Command Reference

### Main Posting Script

```bash
# Post 2 articles now
node scripts/post_caribbean_now_v5.mjs --count=2

# Dry run (test without posting)
node scripts/post_caribbean_now_v5.mjs --dry-run --count=2

# Set up login sessions
node scripts/post_caribbean_now_v5.mjs --setup-login

# Post to specific platforms only
node scripts/post_caribbean_now_v5.mjs --platforms=substack
node scripts/post_caribbean_now_v5.mjs --platforms=twitter
node scripts/post_caribbean_now_v5.mjs --platforms=substack,twitter

# Post different number of articles
node scripts/post_caribbean_now_v5.mjs --count=1
node scripts/post_caribbean_now_v5.mjs --count=3
```

### Scheduler

```bash
# Install automated posting
./scripts/schedule_caribbean_v5.sh install

# Check status
./scripts/schedule_caribbean_v5.sh status

# Uninstall automated posting
./scripts/schedule_caribbean_v5.sh uninstall
```

### Database Management

```bash
# Initialize/refresh database
node scripts/initialize_posts_db.mjs

# View database
cat scripts/posting_history.json | jq

# View posting summary
cat scripts/posting_history.json | jq '.posts[] | {post: .postNumber, title: .title, count: .postCount, lastPosted: .lastPostedAt}'
```

## Monitoring

### Check Posting Status

```bash
./scripts/schedule_caribbean_v5.sh status
```

**Output:**
```
📊 Caribbean Tourism Posting Schedule Status
==============================================

✅ Cron jobs are INSTALLED

📋 Active jobs:
0 13 * * * cd /home/ubuntu/quintapoo-memory && /usr/bin/node ...
0 17 * * * cd /home/ubuntu/quintapoo-memory && /usr/bin/node ...
0 22 * * * cd /home/ubuntu/quintapoo-memory && /usr/bin/node ...

🔐 Session status:
   ✅ Substack session exists
   ✅ Twitter session exists

📊 Database status:
   ✅ Database exists
   📝 Posts: 6
   📊 History records: 56
```

### View Logs

```bash
# View today's 9 AM posting log
tail -f logs/posting_09am.log

# View today's 1 PM posting log
tail -f logs/posting_01pm.log

# View today's 6 PM posting log
tail -f logs/posting_06pm.log

# View all recent logs
tail -100 logs/*.log
```

### Check Posting History

```bash
# View posting history
cat scripts/posting_history.json | jq '.history | sort_by(.postedAt) | reverse | .[0:10]'

# Count posts by platform
cat scripts/posting_history.json | jq '.history | group_by(.platform) | map({platform: .[0].platform, count: length})'

# View posts that need posting
cat scripts/posting_history.json | jq '.posts | sort_by(.postCount) | .[0:3]'
```

## Twitter Thread Format

For long content, the system automatically creates Twitter threads:

**Thread Structure:**
1. **Hook Tweet**: Emoji + Title + Hashtags
2. **Insight Tweet**: Subtitle + Target audience
3. **Key Points**: Bullet points extracted from content
4. **Call to Action**: Link to Substack + Attribution

**Example:**
```
Tweet 1:
🏝️ Caribbean Tourism Shows Strong Recovery in Q1 2026

#CaribbeanTourism #TravelTrends

Tweet 2:
Regional arrivals up 23% compared to 2025, led by digital nomad programs

Target: 320 Caribbean tourism businesses

Tweet 3:
Key insights:

• Digital nomad programs driving long-stay visitors
• Sustainable tourism seeing 31% higher booking rates
• New flight routes reducing travel friction

Tweet 4:
Full article: https://richarddannibarrifortune.substack.com/p/...

#CaribbeanTourism #TravelTrends #DigitalNomads

WUKR Wire Intelligence
```

## Troubleshooting

### Problem: "Not logged in to Substack/Twitter"

**Solution:**
```bash
node scripts/post_caribbean_now_v5.mjs --setup-login
```

Log in manually in the browser windows that open. Sessions will be saved.

### Problem: Session expired

**Solution:**
Same as above. Re-run setup-login to refresh sessions.

### Problem: Cron jobs not running

**Solution:**
```bash
# Check if cron service is running
systemctl status cron

# Check cron logs
grep CRON /var/log/syslog

# Verify cron jobs are installed
crontab -l | grep caribbean
```

### Problem: Posts not rotating correctly

**Solution:**
```bash
# Reinitialize database
node scripts/initialize_posts_db.mjs

# Check database state
cat scripts/posting_history.json | jq '.posts'
```

### Problem: Browser automation fails

**Solution:**
```bash
# Run in non-headless mode to see what's happening
HEADLESS=false node scripts/post_caribbean_now_v5.mjs --dry-run

# Check screenshots in /tmp/
ls -lh /tmp/substack-*.png /tmp/twitter-*.png
```

## File Structure

```
quintapoo-memory/
├── content/
│   └── daily_posts_caribbean_tourism.md    # 6 Caribbean tourism articles
├── scripts/
│   ├── initialize_posts_db.mjs             # Database initialization
│   ├── post_caribbean_now_v5.mjs           # Main posting script
│   ├── schedule_caribbean_v5.sh            # Cron scheduler
│   └── posting_history.json                # Posting database
├── logs/
│   ├── posting_09am.log                    # 9 AM posting logs
│   ├── posting_01pm.log                    # 1 PM posting logs
│   └── posting_06pm.log                    # 6 PM posting logs
└── CARIBBEAN_POSTING_GUIDE_V5.md           # This file
```

## Session Files (in home directory)

```
~/.substack-session.json                     # Substack login session
~/.twitter-session.json                      # Twitter login session
```

## Database Schema

```json
{
  "posts": [
    {
      "id": 1,
      "postNumber": 1,
      "topic": "Caribbean Tourism Recovery Trends",
      "title": "Caribbean Tourism Shows Strong Recovery in Q1 2026",
      "subtitle": "Regional arrivals up 23% compared to 2025...",
      "content": "Full article content...",
      "tags": ["#CaribbeanTourism", "#TravelTrends", ...],
      "targetAudience": "320 Caribbean tourism businesses",
      "lastPostedAt": "2026-02-07T13:04:36.540Z",
      "postCount": 9,
      "substackUrl": "https://...",
      "twitterUrl": "https://...",
      "createdAt": "2026-02-09T...",
      "updatedAt": "2026-02-09T..."
    }
  ],
  "history": [
    {
      "postId": 1,
      "postNumber": 1,
      "platform": "substack",
      "postUrl": "https://...",
      "status": "success",
      "postedAt": "2026-02-07T13:04:36.540Z"
    }
  ],
  "schedule": {
    "timezone": "America/Puerto_Rico",
    "slots": [
      { "time": "09:00", "postsPerSlot": 2, "description": "Morning post" },
      { "time": "13:00", "postsPerSlot": 2, "description": "Afternoon post" },
      { "time": "18:00", "postsPerSlot": 2, "description": "Evening post" }
    ]
  },
  "platforms": {
    "substack": { "enabled": true, "sessionValid": false },
    "twitter": { "enabled": true, "sessionValid": false }
  },
  "metadata": {
    "targetAudience": "320 Caribbean tourism businesses",
    "contentSource": "daily_posts_caribbean_tourism.md",
    "lastUpdated": "2026-02-09T...",
    "version": "1.0"
  }
}
```

## Extending the System

### Add More Posts

1. Edit `content/daily_posts_caribbean_tourism.md`
2. Add new posts following the existing format:

```markdown
## Post 7: Your Topic Here

**Title:** Your Title

**Subtitle:** Your Subtitle

**Content:**

Your content here...

**Tags:** #Tag1 #Tag2 #Tag3

---
```

3. Reinitialize database:

```bash
node scripts/initialize_posts_db.mjs
```

### Add More Platforms

Edit `scripts/post_caribbean_now_v5.mjs` and add new platform handlers:

1. Create a new class (e.g., `LinkedInPoster`)
2. Implement `post()` method
3. Add to platform list in CONFIG
4. Update database schema to include new URL field

### Change Posting Schedule

Edit `scripts/schedule_caribbean_v5.sh`:

```bash
# Change times (in UTC, AST = UTC-4)
# Example: 10:00 AM AST = 14:00 UTC
CRON_JOBS=(
    "0 14 * * * cd $PROJECT_DIR && /usr/bin/node $POSTING_SCRIPT --count=2 >> $LOG_DIR/posting_10am.log 2>&1"
)
```

Then reinstall:

```bash
./scripts/schedule_caribbean_v5.sh uninstall
./scripts/schedule_caribbean_v5.sh install
```

## Best Practices

1. **Session Maintenance**: Re-run `--setup-login` monthly to refresh sessions
2. **Monitor Logs**: Check logs daily for the first week to ensure smooth operation
3. **Backup Database**: Regularly backup `posting_history.json`
4. **Test Before Deploy**: Always use `--dry-run` when testing changes
5. **Gradual Rollout**: Start with 1-2 posts per day, then increase
6. **Content Quality**: Regularly review and update articles in content file
7. **Engagement Tracking**: Monitor Substack and Twitter analytics to optimize posting times

## Success Metrics

Track these metrics to measure success:

- **Posting Consistency**: 6 posts per day, 3 times daily
- **Rotation Balance**: All 6 posts should have similar post counts
- **Platform Reach**: Substack subscribers + Twitter impressions
- **Engagement**: Likes, shares, comments on both platforms
- **Conversion**: Click-throughs from Twitter to Substack
- **Audience Growth**: New followers/subscribers over time

## Support

For issues or questions:

1. Check this guide first
2. Review logs in `logs/` directory
3. Check database state: `cat scripts/posting_history.json | jq`
4. Run in dry-run mode to debug: `--dry-run`
5. Run in visible browser mode: `HEADLESS=false`

## Version History

- **v5** (2026-02-09): Complete rewrite with Playwright, session persistence, Twitter threads
- **v4** (2026-02-08): Added rotation logic and duplicate prevention
- **v3** (2026-02-07): Multi-platform support
- **v2** (2026-02-06): Initial automation
- **v1** (2026-02-05): Manual posting prototype

---

**Built with:** Node.js, Playwright, Bash, Cron  
**Maintained by:** WUKR Wire Intelligence  
**Target:** 320 Caribbean Tourism Businesses  
**Mission:** Autonomous, intelligent, multi-platform content syndication
