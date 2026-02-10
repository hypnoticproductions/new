# Caribbean Tourism Posting System V7 - Quick Start Guide

## Overview

Automated content syndication system that posts Caribbean tourism articles to Substack and Twitter with intelligent rotation and duplicate tracking.

**Target Audience:** 320 Caribbean tourism businesses  
**Content:** 6 Caribbean tourism-focused posts  
**Rotation:** Posts 1-2 at 9 AM, Posts 3-4 at 1 PM, Posts 5-6 at 6 PM AST  
**Platforms:** Substack (primary) + Twitter (secondary)

## Quick Start

### 1. One-Time Setup: Login to Platforms

First, you need to save your login sessions for autonomous operation:

```bash
cd /home/ubuntu/quintapoo-memory

# Setup Substack login (opens browser, wait 60 seconds to log in)
node scripts/post_caribbean_v7.mjs --setup-login --platform=substack

# Setup Twitter login (opens browser, wait 60 seconds to log in)
node scripts/post_caribbean_v7.mjs --setup-login --platform=twitter
```

This saves your browser cookies to:
- `~/.substack-session.json`
- `~/.twitter-session.json`

### 2. Test with Dry Run

Test the system without actually posting:

```bash
cd /home/ubuntu/quintapoo-memory

# Dry run - see what would be posted
node scripts/post_caribbean_v7.mjs --dry-run --count=2
```

### 3. Post 2 Articles Now

Post the next 2 articles in the rotation:

```bash
cd /home/ubuntu/quintapoo-memory

# Post to both Substack and Twitter
node scripts/post_caribbean_v7.mjs --count=2

# Post to Substack only
node scripts/post_caribbean_v7.mjs --count=2 --platform=substack

# Post to Twitter only
node scripts/post_caribbean_v7.mjs --count=2 --platform=twitter
```

## How It Works

### Intelligent Rotation

The system automatically selects which posts to publish based on:

1. **Never posted before** - highest priority
2. **Least posted count** - posts that have been published fewer times
3. **Oldest last posted date** - posts that haven't been published recently
4. **Sequential order** - Post 1, then Post 2, etc.

This ensures fair rotation and prevents duplicates.

### Posting History Tracking

All posting activity is tracked in `scripts/posting_history.json`:

```json
{
  "posts": [
    {
      "id": 1,
      "postNumber": 1,
      "title": "Caribbean Tourism Recovery Trends",
      "lastPostedAt": "2026-02-10T17:00:00.000Z",
      "postCount": 3,
      "substackUrl": "https://richarddannibarrifortune.substack.com/p/...",
      "twitterUrl": "https://x.com/user/status/..."
    }
  ],
  "history": [
    {
      "postId": 1,
      "platform": "substack",
      "url": "https://...",
      "status": "success",
      "postedAt": "2026-02-10T17:00:00.000Z"
    }
  ]
}
```

### Content Format

Posts are formatted differently for each platform:

**Substack:**
- Full title
- Subtitle
- Complete content (all sections, sources, tags)
- Professional long-form article format

**Twitter:**
- 🌴 emoji + title
- Subtitle (if fits)
- Link to Substack article
- "WUKR Wire Intelligence" attribution
- Top 2 hashtags
- Maximum 280 characters

## Daily Posting Schedule

To post 3 times daily (9 AM, 1 PM, 6 PM AST), you can:

### Option 1: Manual Execution

Run the script manually at the scheduled times:

```bash
# 9 AM AST - Posts 1-2
node scripts/post_caribbean_v7.mjs --count=2

# 1 PM AST - Posts 3-4
node scripts/post_caribbean_v7.mjs --count=2

# 6 PM AST - Posts 5-6
node scripts/post_caribbean_v7.mjs --count=2
```

### Option 2: Cron Automation (Recommended)

Set up cron jobs for automatic posting:

```bash
# Edit crontab
crontab -e

# Add these lines (adjust timezone as needed):
# 9 AM AST (13:00 UTC) - Posts 1-2
0 13 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_v7.mjs --count=2 >> /var/log/caribbean-posting.log 2>&1

# 1 PM AST (17:00 UTC) - Posts 3-4
0 17 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_v7.mjs --count=2 >> /var/log/caribbean-posting.log 2>&1

# 6 PM AST (22:00 UTC) - Posts 5-6
0 22 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_v7.mjs --count=2 >> /var/log/caribbean-posting.log 2>&1
```

## Command Line Options

| Option | Description | Example |
|--------|-------------|---------|
| `--dry-run` | Test without posting | `--dry-run` |
| `--setup-login` | Save login sessions | `--setup-login` |
| `--count=N` | Number of posts to publish | `--count=2` |
| `--platform=X` | Platforms to post to | `--platform=substack,twitter` |
| `HEADLESS=false` | Show browser (for debugging) | `HEADLESS=false node ...` |

## Troubleshooting

### Session Expired

If you see "No saved session found" or login errors:

```bash
# Re-run setup for the platform
node scripts/post_caribbean_v7.mjs --setup-login --platform=substack
node scripts/post_caribbean_v7.mjs --setup-login --platform=twitter
```

### View Posting History

```bash
# View posting history
cat scripts/posting_history.json | jq .

# View recent posts
cat scripts/posting_history.json | jq '.history[-10:]'

# View post statistics
cat scripts/posting_history.json | jq '.posts'
```

### Reset Posting History

To start fresh (all posts will be marked as "never posted"):

```bash
# Backup current history
cp scripts/posting_history.json scripts/posting_history.backup.json

# Delete history file (will be recreated on next run)
rm scripts/posting_history.json
```

### Debug Mode

Run with visible browser to see what's happening:

```bash
HEADLESS=false node scripts/post_caribbean_v7.mjs --count=1
```

## Content File

Posts are loaded from: `content/daily_posts_caribbean_tourism.md`

The file contains 6 posts:

1. **Caribbean Tourism Recovery Trends** - Q1 2026 growth analysis
2. **Crisis Management** - Hurricane season communication strategies
3. **Digital Marketing** - Social media ROI and platform strategies
4. **Sustainable Tourism** - Eco-certification benefits and ROI
5. **Workforce Development** - Solving labor shortage challenges
6. **Revenue Management** - Pricing and occupancy optimization

Each post includes:
- Title
- Subtitle
- Full content (2,000-4,000 words)
- Sources
- Tags/hashtags

## Success Metrics

After each run, the script displays:

**Posting Summary:**
- Which posts were published
- URLs for each platform
- Success/failure status

**Overall Statistics:**
- Total posts (6)
- Total publications
- Total failures
- Rotation status (how many times each post has been published)

## Next Steps

1. ✅ **Setup logins** - Run `--setup-login` for both platforms
2. ✅ **Test with dry run** - Verify content looks good
3. ✅ **Post first batch** - Run with `--count=2`
4. ✅ **Set up automation** - Add cron jobs for daily posting
5. ✅ **Monitor results** - Check posting history and URLs

## Support

For issues or questions:
- Check `scripts/posting_history.json` for detailed logs
- Run with `--dry-run` to test without posting
- Use `HEADLESS=false` to see browser automation
- Review error messages in console output

---

**WUKR Wire Daily Dispatch** - Automated Caribbean Tourism Content Syndication
