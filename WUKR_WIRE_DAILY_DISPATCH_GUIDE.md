# WUKR Wire Daily Dispatch - Caribbean Tourism Syndication

## Overview

Automated content syndication system for posting Caribbean tourism articles to Substack and Twitter. The system rotates through 6 high-quality posts, publishing 2 articles at a time, 3 times per day.

**Target Audience:** 320 Caribbean tourism businesses

**Posting Schedule:**
- **9:00 AM AST** - Posts 1-2
- **1:00 PM AST** - Posts 3-4  
- **6:00 PM AST** - Posts 5-6

## Features

✅ **Intelligent Rotation** - Automatically selects next posts based on posting history  
✅ **Duplicate Prevention** - Tracks posting history to avoid republishing too soon  
✅ **Multi-Platform** - Posts to Substack (primary) and Twitter (secondary)  
✅ **Session Persistence** - Saves login sessions for autonomous operation  
✅ **Error Recovery** - Continues posting even if one platform fails  
✅ **Comprehensive Logging** - Tracks all posting activity with timestamps  
✅ **Dry Run Mode** - Test without actually posting  

## Quick Start

### 1. Initial Setup

First, set up your login sessions for both platforms:

```bash
cd /home/ubuntu/quintapoo-memory
node scripts/post_caribbean_rotation.mjs --setup-login
```

This will:
1. Open a browser window for Substack
2. Wait 60 seconds for you to log in
3. Save your Substack session
4. Open a browser window for Twitter
5. Wait 60 seconds for you to log in
6. Save your Twitter session

**Important:** You only need to do this once. Sessions are saved and reused for autonomous operation.

### 2. Test the System

Run a dry-run test to verify everything works:

```bash
./scripts/schedule_daily_posts.sh test
```

This will show you what would be posted without actually posting.

### 3. Manual Test Post

Post 2 articles manually to verify the system works:

```bash
node scripts/post_caribbean_rotation.mjs --count=2
```

### 4. Install Automated Scheduling

Set up cron jobs for automated 3-times-daily posting:

```bash
./scripts/schedule_daily_posts.sh install
```

### 5. Check Status

View current configuration and posting history:

```bash
./scripts/schedule_daily_posts.sh status
```

## File Structure

```
quintapoo-memory/
├── content/
│   └── daily_posts_caribbean_tourism.md    # 6 Caribbean tourism posts
├── scripts/
│   ├── post_caribbean_rotation.mjs         # Main posting script
│   ├── schedule_daily_posts.sh             # Scheduling wrapper
│   └── posting_history.json                # Posting history database
├── logs/
│   ├── post_9am.log                        # 9 AM posting logs
│   ├── post_1pm.log                        # 1 PM posting logs
│   └── post_6pm.log                        # 6 PM posting logs
└── WUKR_WIRE_DAILY_DISPATCH_GUIDE.md       # This file
```

## Content Posts

The system rotates through these 6 posts:

1. **Caribbean Tourism Recovery Trends** - Q1 2026 growth data and digital nomad programs
2. **Crisis Management** - Hurricane season communication strategies
3. **Digital Marketing** - Social media ROI for Caribbean tourism
4. **Sustainable Tourism** - Eco-certification and revenue impact
5. **Workforce Development** - Solving the Caribbean tourism labor shortage
6. **Tourism Technology** - Essential tools for Caribbean operators

Each post includes:
- Professional title and subtitle
- 2000-5000 word comprehensive content
- Industry sources and citations
- Relevant hashtags for social media

## Rotation Logic

The system intelligently selects which posts to publish based on:

1. **Never Posted** - Posts that have never been published get highest priority
2. **Least Posted** - Posts with the lowest post count are selected next
3. **Oldest First** - Posts with the oldest last-posted date are prioritized
4. **Sequential Order** - If all else is equal, posts are selected in order (1, 2, 3, 4, 5, 6)

This ensures even distribution and prevents any post from being over-represented.

## Platform-Specific Formatting

### Substack
- Full article with title, subtitle, and complete content
- Professional formatting with headers and sections
- Sources and tags included
- Captures published URL for tracking

### Twitter
- Automatically formatted to 280 character limit
- Includes: emoji + headline + insight + Substack URL + attribution + hashtags
- Links back to Substack post
- Attribution: "WUKR Wire Intelligence"

Example Twitter format:
```
🌴 Caribbean Tourism Shows Strong Recovery in Q1 2026

Regional arrivals up 23% compared to 2025, led by digital nomad programs

[Substack URL]

WUKR Wire Intelligence
#CaribbeanTourism #TravelTrends
```

## Command Reference

### Main Posting Script

```bash
# Post 2 articles (default)
node scripts/post_caribbean_rotation.mjs

# Post custom number of articles
node scripts/post_caribbean_rotation.mjs --count=3

# Dry run (test without posting)
node scripts/post_caribbean_rotation.mjs --dry-run

# Set up login sessions
node scripts/post_caribbean_rotation.mjs --setup-login

# Run in non-headless mode (see browser)
HEADLESS=false node scripts/post_caribbean_rotation.mjs
```

### Scheduling Script

```bash
# Install cron jobs
./scripts/schedule_daily_posts.sh install

# Uninstall cron jobs
./scripts/schedule_daily_posts.sh uninstall

# Check status
./scripts/schedule_daily_posts.sh status

# Run test
./scripts/schedule_daily_posts.sh test
```

## Posting History Database

The system maintains a JSON database at `scripts/posting_history.json` with:

**Posts Array:**
```json
{
  "id": 1,
  "postNumber": 1,
  "title": "Post 1",
  "lastPostedAt": "2026-02-05T13:00:00.000Z",
  "postCount": 5,
  "substackUrl": "https://richarddannibarrifortune.substack.com/p/...",
  "twitterUrl": "https://x.com/user/status/..."
}
```

**History Array:**
```json
{
  "postId": 1,
  "platform": "substack",
  "url": "https://...",
  "status": "success",
  "postedAt": "2026-02-05T13:00:00.000Z"
}
```

## Monitoring and Logs

### Check Recent Activity

```bash
# View 9 AM posting log
tail -f logs/post_9am.log

# View 1 PM posting log
tail -f logs/post_1pm.log

# View 6 PM posting log
tail -f logs/post_6pm.log

# View all recent logs
tail -f logs/*.log
```

### Check Posting Stats

```bash
# View posting history
cat scripts/posting_history.json | jq '.posts'

# Count total publications
cat scripts/posting_history.json | jq '.history | length'

# View recent publications
cat scripts/posting_history.json | jq '.history[-10:]'
```

## Troubleshooting

### Sessions Expired

If you see login errors, your sessions may have expired. Re-run setup:

```bash
node scripts/post_caribbean_rotation.mjs --setup-login
```

### Browser Not Found

If Playwright can't find the browser:

```bash
cd /home/ubuntu/quintapoo-memory
npx playwright install chromium
```

### Cron Jobs Not Running

Check if cron service is running:

```bash
sudo service cron status
sudo service cron restart
```

View cron logs:

```bash
grep CRON /var/log/syslog
```

### Posting Failed

Check the specific log file for error details:

```bash
cat logs/post_9am.log
cat logs/post_1pm.log
cat logs/post_6pm.log
```

Common issues:
- Session expired (re-run `--setup-login`)
- Network connectivity issues
- Platform UI changes (may need script updates)
- Rate limiting (wait and retry)

## Manual Operations

### Post Specific Articles

To post specific post numbers (not recommended, breaks rotation):

```bash
# Modify the script temporarily or use the database directly
# Better: Let the rotation system handle selection
```

### Reset Posting History

To start fresh (will re-post all articles):

```bash
rm scripts/posting_history.json
# Next run will initialize fresh database
```

### Update Content

Edit the content file:

```bash
nano content/daily_posts_caribbean_tourism.md
```

Changes take effect immediately on next posting.

## Scheduled Task Times

The system uses cron to schedule posts. Times are in UTC (server time):

| Local Time (AST) | UTC Time | Cron Expression | Posts |
|------------------|----------|-----------------|-------|
| 9:00 AM          | 1:00 PM  | `0 13 * * *`    | 1-2   |
| 1:00 PM          | 5:00 PM  | `0 17 * * *`    | 3-4   |
| 6:00 PM          | 10:00 PM | `0 22 * * *`    | 5-6   |

**Note:** AST (Atlantic Standard Time) = UTC-4

## Integration with Base 44

This system is designed to work with the Base 44 content pipeline:

1. **Content Creation** - Articles written and stored in `daily_posts_caribbean_tourism.md`
2. **Automated Posting** - This system posts to Substack and Twitter
3. **URL Tracking** - Published URLs stored in `posting_history.json`
4. **Multi-Platform** - Ready to extend to LinkedIn, Hashnode, Dev.to

## Future Enhancements

Planned features:

- [ ] LinkedIn integration
- [ ] Hashnode integration
- [ ] Dev.to integration
- [ ] Email notifications on posting
- [ ] Analytics dashboard
- [ ] A/B testing for post titles
- [ ] Automatic content refresh
- [ ] Database integration (MySQL/TiDB)

## Security Notes

**Session Files:**
- `.substack-session.json` - Contains Substack authentication cookies
- `.twitter-session.json` - Contains Twitter authentication cookies

These files are stored in your home directory (`~`) and should be kept secure. They are NOT committed to Git.

**Permissions:**
```bash
chmod 600 ~/.substack-session.json
chmod 600 ~/.twitter-session.json
```

## Support

For issues or questions:

1. Check the logs: `./scripts/schedule_daily_posts.sh status`
2. Run a test: `./scripts/schedule_daily_posts.sh test`
3. Review posting history: `cat scripts/posting_history.json`
4. Check cron logs: `grep CRON /var/log/syslog`

## License

Proprietary - WUKR Wire / Dopa Tech

---

**Last Updated:** February 5, 2026  
**Version:** 1.0.0  
**Author:** WUKR Wire Development Team
