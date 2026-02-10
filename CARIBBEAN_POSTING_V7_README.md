# Caribbean Tourism Content Syndication System V7

**WUKR Wire Daily Dispatch** - Automated content syndication to Substack and Twitter

## 🎯 Overview

This system automates the posting of Caribbean tourism-focused articles to Substack and Twitter, targeting 320 Caribbean tourism businesses. It intelligently rotates through 6 high-quality posts with duplicate tracking and error recovery.

### Key Features

✅ **Intelligent Rotation** - Posts are selected based on posting history (never posted → least posted → oldest)  
✅ **Dual Platform** - Substack (long-form) + Twitter (280 char summaries)  
✅ **Session Persistence** - Saves browser cookies for autonomous operation  
✅ **Duplicate Tracking** - JSON-based history prevents re-posting  
✅ **Error Recovery** - Continues if one platform fails  
✅ **Flexible Scheduling** - Run manually or via cron jobs  

## 📋 Content

The system rotates through 6 professionally-written posts:

1. **Caribbean Tourism Recovery Trends** - Q1 2026 growth analysis and digital nomad programs
2. **Crisis Management** - Hurricane season communication strategies
3. **Digital Marketing** - Social media ROI across Instagram, TikTok, Facebook, Pinterest
4. **Sustainable Tourism** - Eco-certification benefits and 31% revenue increase
5. **Workforce Development** - Solving labor shortage with innovative strategies
6. **Revenue Management** - Technology tools for Caribbean operators

Each post is 2,000-4,000 words with sources, tags, and actionable insights.

## 🚀 Quick Start

### 1. One-Time Setup

Set up login sessions for autonomous posting:

```bash
cd /home/ubuntu/quintapoo-memory

# Easy way - use wrapper script
./scripts/post_now_v7.sh setup

# Or manually
node scripts/post_caribbean_v7.mjs --setup-login --platform=substack
node scripts/post_caribbean_v7.mjs --setup-login --platform=twitter
```

This opens a browser window for 60 seconds. Log in to each platform, then the session is saved.

### 2. Test with Dry Run

```bash
# Test without posting
./scripts/post_now_v7.sh dry-run

# Or manually
node scripts/post_caribbean_v7.mjs --dry-run --count=2
```

### 3. Post 2 Articles

```bash
# Post to both platforms
./scripts/post_now_v7.sh

# Post to Substack only
./scripts/post_now_v7.sh substack

# Post to Twitter only
./scripts/post_now_v7.sh twitter

# Or manually
node scripts/post_caribbean_v7.mjs --count=2
```

## 📅 Daily Posting Schedule

**Recommended Schedule:** 3 times daily (9 AM, 1 PM, 6 PM AST)

### Option 1: Manual Execution

```bash
# 9 AM AST - Posts 1-2
./scripts/post_now_v7.sh

# 1 PM AST - Posts 3-4
./scripts/post_now_v7.sh

# 6 PM AST - Posts 5-6
./scripts/post_now_v7.sh
```

### Option 2: Cron Automation

```bash
# Edit crontab
crontab -e

# Add these lines (AST = UTC-4):
# 9 AM AST (13:00 UTC)
0 13 * * * cd /home/ubuntu/quintapoo-memory && ./scripts/post_now_v7.sh >> /var/log/caribbean-posting.log 2>&1

# 1 PM AST (17:00 UTC)
0 17 * * * cd /home/ubuntu/quintapoo-memory && ./scripts/post_now_v7.sh >> /var/log/caribbean-posting.log 2>&1

# 6 PM AST (22:00 UTC)
0 22 * * * cd /home/ubuntu/quintapoo-memory && ./scripts/post_now_v7.sh >> /var/log/caribbean-posting.log 2>&1
```

### Option 3: External Cron Service (cron-job.org)

For cloud-based scheduling without a local server:

1. Go to [cron-job.org](https://cron-job.org)
2. Create a new cron job
3. Set URL to trigger your posting script (requires webhook endpoint)
4. Schedule: 9 AM, 1 PM, 6 PM AST

## 🛠️ Command Reference

### Wrapper Script (`post_now_v7.sh`)

```bash
./scripts/post_now_v7.sh              # Post 2 articles to both platforms
./scripts/post_now_v7.sh dry-run      # Test without posting
./scripts/post_now_v7.sh setup        # Setup login sessions
./scripts/post_now_v7.sh substack     # Post to Substack only
./scripts/post_now_v7.sh twitter      # Post to Twitter only
```

### Direct Node Script (`post_caribbean_v7.mjs`)

```bash
# Basic usage
node scripts/post_caribbean_v7.mjs --count=2

# Options
--dry-run                          # Test without posting
--setup-login                      # Save login sessions
--count=N                          # Number of posts (default: 2)
--platform=substack,twitter        # Platforms to post to
HEADLESS=false                     # Show browser (for debugging)

# Examples
node scripts/post_caribbean_v7.mjs --dry-run --count=1
node scripts/post_caribbean_v7.mjs --count=2 --platform=substack
HEADLESS=false node scripts/post_caribbean_v7.mjs --setup-login
```

## 📊 How It Works

### Intelligent Rotation Algorithm

Posts are selected based on this priority:

1. **Never posted before** - Highest priority
2. **Least posted count** - Posts published fewer times
3. **Oldest last posted date** - Posts not published recently
4. **Sequential order** - Post 1, 2, 3, etc.

This ensures:
- All posts get published fairly
- No post is over-used
- Fresh content rotation
- No manual tracking needed

### Platform-Specific Formatting

**Substack (Long-Form):**
```
Title: Caribbean Tourism Recovery Trends
Subtitle: Regional arrivals up 23% compared to 2025...
Content: [Full 2,000-4,000 word article]
```

**Twitter (Short-Form):**
```
🌴 Caribbean Tourism Recovery Trends

Regional arrivals up 23% compared to 2025...

[Substack URL]

WUKR Wire Intelligence
#CaribbeanTourism #TravelTrends
```

### Posting History Tracking

All activity is logged in `scripts/posting_history.json`:

```json
{
  "posts": [
    {
      "id": 1,
      "postNumber": 1,
      "title": "Caribbean Tourism Recovery Trends",
      "lastPostedAt": "2026-02-10T13:00:00.000Z",
      "postCount": 9,
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
      "postedAt": "2026-02-10T13:00:00.000Z"
    }
  ]
}
```

## 🔧 Troubleshooting

### Session Expired

If you see login errors:

```bash
# Re-setup the platform
./scripts/post_now_v7.sh setup

# Or manually
HEADLESS=false node scripts/post_caribbean_v7.mjs --setup-login --platform=substack
```

### View Posting History

```bash
# Pretty print history
cat scripts/posting_history.json | jq .

# View recent posts
cat scripts/posting_history.json | jq '.history[-10:]'

# View post statistics
cat scripts/posting_history.json | jq '.posts'
```

### Reset Posting History

```bash
# Backup current history
cp scripts/posting_history.json scripts/posting_history.backup.json

# Delete to start fresh
rm scripts/posting_history.json

# Next run will recreate it
./scripts/post_now_v7.sh dry-run
```

### Debug Mode

See browser automation in action:

```bash
HEADLESS=false node scripts/post_caribbean_v7.mjs --count=1
```

### Check Logs

```bash
# If using cron
tail -f /var/log/caribbean-posting.log

# Or run manually to see output
./scripts/post_now_v7.sh
```

## 📁 File Structure

```
quintapoo-memory/
├── content/
│   └── daily_posts_caribbean_tourism.md    # 6 posts source file
├── scripts/
│   ├── post_caribbean_v7.mjs               # Main posting script
│   ├── post_now_v7.sh                      # Wrapper script
│   └── posting_history.json                # Posting history database
├── CARIBBEAN_POSTING_QUICKSTART_V7.md      # Quick start guide
├── CARIBBEAN_POSTING_V7_README.md          # This file
└── ~/.substack-session.json                # Saved Substack session
└── ~/.twitter-session.json                 # Saved Twitter session
```

## 🎓 Best Practices

### Daily Posting

1. **Consistency** - Post at the same times daily (9 AM, 1 PM, 6 PM AST)
2. **Monitor** - Check posting history weekly to ensure rotation is working
3. **Refresh Sessions** - Re-run setup every 30 days to refresh login cookies
4. **Backup History** - Keep backups of `posting_history.json`

### Content Updates

To update the 6 posts:

1. Edit `content/daily_posts_caribbean_tourism.md`
2. Keep the same structure (## Post 1:, **Title:**, etc.)
3. Test with dry run: `./scripts/post_now_v7.sh dry-run`
4. Post normally: `./scripts/post_now_v7.sh`

### Error Handling

The system is designed to be resilient:

- If Substack fails, Twitter still posts
- If Twitter fails, Substack still posts
- Errors are logged in posting history
- Script continues to next post even if one fails

## 📈 Success Metrics

After each run, you'll see:

**Posting Summary:**
```
Post 1: Caribbean Tourism Recovery Trends
  📝 Substack: https://richarddannibarrifortune.substack.com/p/...
  🐦 Twitter: https://x.com/user/status/...
```

**Overall Statistics:**
```
Total posts: 6
Total publications: 60
Total failures: 4
Post rotation status:
  Post 1: Posted 9 times, last: 2026-02-07T13:04:36.540Z
  Post 2: Posted 9 times, last: 2026-02-07T13:04:36.542Z
  ...
```

## 🔐 Security

- Sessions are stored locally in `~/.substack-session.json` and `~/.twitter-session.json`
- No passwords are stored
- Sessions expire after ~30 days (platform-dependent)
- Use `--setup-login` to refresh sessions

## 🚦 Next Steps

1. ✅ **Setup logins** - Run `./scripts/post_now_v7.sh setup`
2. ✅ **Test with dry run** - Run `./scripts/post_now_v7.sh dry-run`
3. ✅ **Post first batch** - Run `./scripts/post_now_v7.sh`
4. ✅ **Set up automation** - Add cron jobs or use cron-job.org
5. ✅ **Monitor results** - Check posting history and platform analytics

## 📞 Support

For issues:
- Check `scripts/posting_history.json` for detailed logs
- Run with `--dry-run` to test without posting
- Use `HEADLESS=false` to see browser automation
- Review error messages in console output

---

**WUKR Wire Daily Dispatch** - Automated Caribbean Tourism Content Syndication  
Version 7.0 | February 2026
