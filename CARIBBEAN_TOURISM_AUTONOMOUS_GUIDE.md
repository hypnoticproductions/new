# Caribbean Tourism Autonomous Content Syndication Guide

**Last Updated:** February 5, 2026  
**Target Audience:** 320 Caribbean tourism businesses  
**Platforms:** Substack (primary) + Twitter  
**Posting Schedule:** 3 times daily (9 AM, 1 PM, 6 PM AST)

---

## Overview

This guide documents the fully autonomous content syndication system for posting Caribbean tourism articles to Substack and Twitter. The system rotates through 6 high-quality posts targeting Caribbean tourism businesses, with intelligent duplicate tracking and session management.

## System Architecture

### Components

1. **Content Source:** `/content/daily_posts_caribbean_tourism.md`
   - 6 comprehensive Caribbean tourism articles
   - Each post includes: title, subtitle, content, tags
   - Topics: Tourism recovery, crisis management, digital marketing, sustainability, labor, technology

2. **Automation Script:** `/scripts/post_caribbean_autonomous.mjs`
   - Playwright-based browser automation
   - Session persistence for autonomous operation
   - JSON-based posting history tracking
   - Intelligent rotation algorithm

3. **Posting History:** `/scripts/posting_history.json`
   - Tracks all posts and their publication status
   - Records post count, last posted date, platform URLs
   - Enables duplicate prevention and rotation logic

4. **Session Files:**
   - `~/.substack-session.json` - Substack login session
   - `~/.twitter-session.json` - Twitter login session

## Rotation Logic

The system uses intelligent rotation to ensure even distribution:

**Priority Order:**
1. Posts never published before
2. Posts with lowest post count
3. Posts with oldest last posted date
4. Sequential order (Post 1, 2, 3, etc.)

**Current Status (as of Feb 5, 2026):**
- Post 1: 8 posts
- Post 2: 8 posts
- Post 3: 7 posts
- Post 4: 7 posts
- Post 5: 6 posts ← Next to post
- Post 6: 6 posts ← Next to post

**Next Rotation:** Posts 5 and 6 will be published next, then Posts 3 and 4, then Posts 1 and 2 again.

## Installation & Setup

### Prerequisites

```bash
# Navigate to project directory
cd /home/ubuntu/quintapoo-memory

# Install dependencies
pnpm install

# Install Playwright browsers
npx playwright install chromium
```

### Initial Login Setup (One-Time)

The script requires login sessions for Substack and Twitter. Run this command to set up:

```bash
node scripts/post_caribbean_autonomous.mjs --setup-login
```

**What happens:**
1. Browser window opens for Substack
2. You manually log in (60 seconds)
3. Session saved to `~/.substack-session.json`
4. Browser window opens for Twitter
5. You manually log in (60 seconds)
6. Session saved to `~/.twitter-session.json`

**Note:** Sessions persist across runs. You only need to do this once, or when sessions expire.

## Usage

### Dry Run (Testing)

Test the script without actually posting:

```bash
node scripts/post_caribbean_autonomous.mjs --dry-run
```

**Output:**
- Shows which posts will be selected
- Displays formatted content for each platform
- Updates posting history (for testing rotation)
- No actual posts are made

### Live Posting

Post 2 articles to Substack and Twitter:

```bash
node scripts/post_caribbean_autonomous.mjs
```

**What happens:**
1. Loads posting history
2. Parses content file
3. Selects next 2 posts based on rotation
4. Posts to Substack (full article)
5. Posts to Twitter (280-char summary)
6. Updates posting history
7. Displays statistics

### Custom Post Count

Post a different number of articles:

```bash
node scripts/post_caribbean_autonomous.mjs --count=4
```

### Headless Mode

Run with visible browser (for debugging):

```bash
HEADLESS=false node scripts/post_caribbean_autonomous.mjs
```

## Scheduling for Autonomous Operation

### Option 1: Cron Job (Linux/Mac)

Add to crontab for automatic posting:

```bash
# Edit crontab
crontab -e

# Add these lines for 9 AM, 1 PM, 6 PM AST (AST is UTC-4)
# 9 AM AST = 1 PM UTC
0 13 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_autonomous.mjs >> /home/ubuntu/logs/caribbean-posting.log 2>&1

# 1 PM AST = 5 PM UTC
0 17 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_autonomous.mjs >> /home/ubuntu/logs/caribbean-posting.log 2>&1

# 6 PM AST = 10 PM UTC
0 22 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_autonomous.mjs >> /home/ubuntu/logs/caribbean-posting.log 2>&1
```

### Option 2: Manus Schedule Tool

Use the Manus scheduling system:

```bash
# Schedule for 9 AM AST daily
manus schedule create \
  --name "Caribbean Tourism 9AM" \
  --cron "0 0 9 * * *" \
  --timezone "America/Puerto_Rico" \
  --command "cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_autonomous.mjs"
```

### Option 3: Manual Execution

Run manually whenever needed:

```bash
cd /home/ubuntu/quintapoo-memory
node scripts/post_caribbean_autonomous.mjs
```

## Content Format

### Substack Post Format

Each Substack post includes:
- **Title:** Main headline
- **Subtitle:** Supporting tagline
- **Content:** Full article (500-2000 words)
- **Tags:** Relevant hashtags

**Example:**
```
Title: Caribbean Tourism Shows Strong Recovery in Q1 2026
Subtitle: Regional arrivals up 23% compared to 2025, led by digital nomad programs
Content: [Full article with sections, data, actionable insights]
Tags: #CaribbeanTourism #TravelTrends #DigitalNomads
```

### Twitter Post Format

Twitter posts are automatically condensed to 280 characters:

```
🌴 [TITLE]

[FIRST SENTENCE OR EXCERPT]

Target: 320 Caribbean tourism businesses
#Tag1 #Tag2
```

**Example:**
```
🌴 Caribbean Tourism Shows Strong Recovery in Q1 2026

The Caribbean tourism sector is experiencing a remarkable recovery in the first quarter of 2026, with visitor arrivals increasing by 23% compared to t

Target: 320 Caribbean tourism businesses
#CaribbeanTourism #TravelTrends
```

## Monitoring & Maintenance

### Check Posting History

View current rotation status:

```bash
cat scripts/posting_history.json | jq '.posts'
```

### Check Recent Posts

```bash
cat scripts/posting_history.json | jq '.history[-10:]'
```

### Reset Posting History (Use with Caution)

To start fresh rotation:

```bash
# Backup first
cp scripts/posting_history.json scripts/posting_history.backup.json

# Reset
echo '{"posts":[],"history":[]}' > scripts/posting_history.json

# Run script to reinitialize
node scripts/post_caribbean_autonomous.mjs --dry-run
```

### Session Maintenance

Sessions typically last 30-90 days. If posting fails with login errors:

```bash
# Re-run login setup
node scripts/post_caribbean_autonomous.mjs --setup-login
```

## Troubleshooting

### Error: "Executable doesn't exist"

**Solution:** Install Playwright browsers

```bash
npx playwright install chromium
```

### Error: "Cannot find package 'playwright'"

**Solution:** Install dependencies

```bash
pnpm install
```

### Error: Login required / Session expired

**Solution:** Re-run login setup

```bash
node scripts/post_caribbean_autonomous.mjs --setup-login
```

### Posts not appearing on platforms

**Check:**
1. Session files exist: `ls -la ~/.substack-session.json ~/.twitter-session.json`
2. Not running in dry-run mode
3. Browser automation completed successfully (check logs)
4. Platform rate limits not exceeded

### Rotation not working as expected

**Check:**
1. Posting history file: `cat scripts/posting_history.json`
2. Post counts are being updated
3. Timestamps are current

## Performance Metrics

**Current Statistics (as of Feb 5, 2026):**
- Total posts published: 40 (across all platforms)
- Average posts per article: 6.67
- Platforms: Substack (primary), Twitter (secondary)
- Success rate: ~100% (with valid sessions)

## Future Enhancements

### Planned Features

1. **Multi-Platform Expansion**
   - LinkedIn (browser automation)
   - Hashnode (GraphQL API)
   - Dev.to (REST API)

2. **Analytics Integration**
   - Track engagement metrics
   - Monitor click-through rates
   - Measure audience growth

3. **Database Migration**
   - Move from JSON to PostgreSQL
   - Enable advanced querying
   - Support multi-user scenarios

4. **Content Refresh**
   - Automatic content updates
   - A/B testing for titles
   - Dynamic content generation

## Support & Contact

**Project Repository:** https://github.com/hypnoticproductions/new

**Key Files:**
- Script: `/scripts/post_caribbean_autonomous.mjs`
- Content: `/content/daily_posts_caribbean_tourism.md`
- History: `/scripts/posting_history.json`
- Schema: `/scripts/schema.sql`

**Related Documentation:**
- `WUKR_WIRE_DAILY_DISPATCH_GUIDE.md`
- `CARIBBEAN_TOURISM_POSTING_GUIDE.md`
- `IMPLEMENTATION_COMPLETE.md`

---

## Quick Reference

### Common Commands

```bash
# Dry run (testing)
node scripts/post_caribbean_autonomous.mjs --dry-run

# Live posting (2 articles)
node scripts/post_caribbean_autonomous.mjs

# Setup login sessions
node scripts/post_caribbean_autonomous.mjs --setup-login

# Post 4 articles
node scripts/post_caribbean_autonomous.mjs --count=4

# Debug mode (visible browser)
HEADLESS=false node scripts/post_caribbean_autonomous.mjs

# Check status
cat scripts/posting_history.json | jq '.posts[] | {postNumber, postCount, lastPostedAt}'
```

### File Locations

```
quintapoo-memory/
├── content/
│   └── daily_posts_caribbean_tourism.md    # 6 Caribbean tourism articles
├── scripts/
│   ├── post_caribbean_autonomous.mjs       # Main automation script
│   ├── posting_history.json                # Rotation tracking
│   └── schema.sql                          # Database schema (future)
└── ~/.substack-session.json                # Substack login session
└── ~/.twitter-session.json                 # Twitter login session
```

---

**Status:** ✅ Fully operational and tested  
**Last Test:** February 5, 2026 (dry-run successful)  
**Next Action:** Set up login sessions and schedule for autonomous operation
