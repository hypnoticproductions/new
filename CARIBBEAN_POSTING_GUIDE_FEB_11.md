# Caribbean Tourism Content Syndication System - February 2026

## Overview

Automated content syndication system for posting Caribbean tourism-focused articles to Substack and Twitter. Targets **320 Caribbean tourism businesses** with valuable industry insights.

## Features

- ✅ **Intelligent Rotation**: Automatically rotates through 6 posts to avoid duplicates
- ✅ **Multi-Platform**: Posts to Substack and Twitter simultaneously
- ✅ **Duplicate Prevention**: JSON-based tracking ensures posts aren't repeated too frequently
- ✅ **Session Persistence**: Saves login sessions for autonomous operation
- ✅ **Twitter Threads**: Automatically creates threads for longer content
- ✅ **Error Handling**: Robust error recovery and logging
- ✅ **Dry Run Mode**: Test without actually posting

## Content Schedule

The system manages 6 Caribbean tourism posts with the following rotation schedule:

- **9:00 AM AST**: Posts 1-2
- **1:00 PM AST**: Posts 3-4
- **6:00 PM AST**: Posts 5-6

### Post Topics

1. **Caribbean Tourism Recovery Trends** - Market analysis and growth drivers
2. **Crisis Management for Caribbean Tourism Operators** - Hurricane season communication strategies
3. **Digital Marketing Strategies** - Social media ROI and platform optimization
4. **Sustainable Tourism Certification Benefits** - Eco-certification business case
5. **Caribbean Tourism Workforce Development** - Staff training and retention
6. **Revenue Management for Caribbean Properties** - Pricing and yield optimization

## Quick Start

### Prerequisites

1. **Playwright installed** (already in package.json)
2. **Content file exists**: `/home/ubuntu/quintapoo-memory/content/daily_posts_caribbean_tourism.md`
3. **Login sessions**: You'll need to login to Substack and Twitter on first run

### Installation

```bash
cd /home/ubuntu/quintapoo-memory
pnpm install  # Playwright is already in dependencies
```

### First Time Setup

The script will prompt you to login on first run. It saves your session for future autonomous operation.

### Running the Script

**Basic usage (post 2 articles to both platforms):**
```bash
cd /home/ubuntu/quintapoo-memory
./scripts/post_caribbean.sh
```

**Or use the Node.js script directly:**
```bash
node scripts/post_caribbean_tourism_now.mjs
```

**Dry run (test without posting):**
```bash
./scripts/post_caribbean.sh --dry-run
```

**Post to specific platform only:**
```bash
node scripts/post_caribbean_tourism_now.mjs --platform=substack
node scripts/post_caribbean_tourism_now.mjs --platform=twitter
```

**Post different number of articles:**
```bash
node scripts/post_caribbean_tourism_now.mjs --count=1
node scripts/post_caribbean_tourism_now.mjs --count=3
```

## How It Works

### 1. Rotation Logic

The system uses intelligent rotation to ensure fair distribution:

**Priority order:**
1. Posts never published before
2. Posts with lowest publication count
3. Posts with oldest last-published date
4. Sequential order (Post 1, 2, 3, etc.)

### 2. Posting History Tracking

All posting activity is tracked in `scripts/posting_history.json`:

```json
{
  "posts": [
    {
      "id": 1,
      "postNumber": 1,
      "title": "Caribbean Tourism Recovery Trends",
      "lastPostedAt": "2026-02-11T09:00:00.000Z",
      "postCount": 3,
      "substackUrl": "https://richarddannibarrifortune.substack.com/p/...",
      "twitterUrl": "https://x.com/..."
    }
  ],
  "history": [
    {
      "postId": 1,
      "platform": "substack",
      "url": "https://...",
      "status": "success",
      "postedAt": "2026-02-11T09:00:00.000Z"
    }
  ]
}
```

### 3. Session Management

Login sessions are saved for autonomous operation:

- **Substack**: `~/.substack-session.json`
- **Twitter**: `~/.twitter-session.json`

These files contain browser cookies and storage state, allowing the script to run without manual login.

### 4. Content Formatting

**Substack:**
- Full article with title, subtitle, content, sources, and tags
- Markdown formatting converted to HTML
- Professional formatting with proper paragraphs

**Twitter:**
- Short format: Title + excerpt + link + hashtags (if under 280 chars)
- Thread format: Multiple tweets for longer content
- Includes link back to Substack article

## Scheduling for Automation

### Using Cron (Linux/Mac)

Edit your crontab:
```bash
crontab -e
```

Add these lines for 3x daily posting (9 AM, 1 PM, 6 PM AST):
```cron
# Caribbean Tourism Posting - 9 AM AST (adjust timezone as needed)
0 9 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_tourism_now.mjs --count=2 >> /tmp/caribbean_posting.log 2>&1

# Caribbean Tourism Posting - 1 PM AST
0 13 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_tourism_now.mjs --count=2 >> /tmp/caribbean_posting.log 2>&1

# Caribbean Tourism Posting - 6 PM AST
0 18 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_tourism_now.mjs --count=2 >> /tmp/caribbean_posting.log 2>&1
```

**Note:** AST is UTC-4. Adjust times based on your server timezone.

### Using GitHub Actions (Recommended)

Create `.github/workflows/caribbean-posting.yml`:

```yaml
name: Caribbean Tourism Posting

on:
  schedule:
    # 9 AM AST = 1 PM UTC
    - cron: '0 13 * * *'
    # 1 PM AST = 5 PM UTC
    - cron: '0 17 * * *'
    # 6 PM AST = 10 PM UTC
    - cron: '0 22 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  post:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run posting script
        env:
          SUBSTACK_SESSION: ${{ secrets.SUBSTACK_SESSION }}
          TWITTER_SESSION: ${{ secrets.TWITTER_SESSION }}
        run: |
          echo "$SUBSTACK_SESSION" > ~/.substack-session.json
          echo "$TWITTER_SESSION" > ~/.twitter-session.json
          node scripts/post_caribbean_tourism_now.mjs --count=2
```

**Setup GitHub Secrets:**
1. Run the script locally once to generate session files
2. Copy contents of `~/.substack-session.json` to GitHub secret `SUBSTACK_SESSION`
3. Copy contents of `~/.twitter-session.json` to GitHub secret `TWITTER_SESSION`

## Monitoring and Maintenance

### Check Posting Status

View posting history:
```bash
cat /home/ubuntu/quintapoo-memory/scripts/posting_history.json | jq .
```

View recent posts:
```bash
cat /home/ubuntu/quintapoo-memory/scripts/posting_history.json | jq '.history[-10:]'
```

Check post rotation status:
```bash
cat /home/ubuntu/quintapoo-memory/scripts/posting_history.json | jq '.posts[] | {postNumber, title, postCount, lastPosted: .lastPostedAt}'
```

### Session Refresh

If sessions expire (you'll see login errors), run the script manually in non-headless mode:

```bash
HEADLESS=false node scripts/post_caribbean_tourism_now.mjs --dry-run
```

Login when prompted, then the session will be saved for future runs.

### Troubleshooting

**Problem: "Not logged in to Substack/Twitter"**
- Solution: Run script with `HEADLESS=false` and login manually
- Sessions are saved automatically after successful login

**Problem: Posts not rotating correctly**
- Solution: Check `posting_history.json` for correct tracking
- Delete the file to reset rotation (all posts will be marked as never posted)

**Problem: Twitter thread not working**
- Solution: Content may be too long. Edit content file to shorten posts
- Or post to Substack only: `--platform=substack`

**Problem: Rate limiting errors**
- Solution: Script includes 30-second delays between posts
- Reduce `--count` parameter or increase delays in code

## File Structure

```
quintapoo-memory/
├── content/
│   └── daily_posts_caribbean_tourism.md    # Source content (6 posts)
├── scripts/
│   ├── post_caribbean_tourism_now.mjs      # Main posting script (NEW)
│   ├── post_caribbean.sh                   # Shell wrapper (NEW)
│   ├── posting_history.json                # Tracking database
│   └── schema.sql                          # Database schema (for reference)
└── CARIBBEAN_POSTING_GUIDE_FEB_11.md       # This file
```

## API Reference

### Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--dry-run` | Test mode, no actual posting | `false` |
| `--count=N` | Number of posts to publish | `2` |
| `--platform=P1,P2` | Target platforms (substack,twitter) | `substack,twitter` |

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `HEADLESS` | Run browser in headless mode | `true` |
| `HOME` | User home directory for session files | `/home/ubuntu` |

## Best Practices

1. **Test First**: Always run with `--dry-run` before actual posting
2. **Monitor Logs**: Check posting history regularly for errors
3. **Refresh Sessions**: Re-login every 30 days to keep sessions valid
4. **Backup History**: Keep backups of `posting_history.json`
5. **Content Updates**: Update content file regularly with fresh insights
6. **Rate Limits**: Respect platform rate limits (30s between posts)

## Comparison with Previous Versions

This new script (`post_caribbean_tourism_now.mjs`) improves on previous versions:

- ✅ **Cleaner code structure** with better class organization
- ✅ **More robust error handling** with detailed logging
- ✅ **Better session management** with automatic save/restore
- ✅ **Improved Twitter threading** for longer content
- ✅ **Simplified command-line interface** with clear options
- ✅ **Shell wrapper** for easier execution

## Support

For issues or questions:
- Check `posting_history.json` for error logs
- Review console output for detailed error messages
- Test with `--dry-run` to isolate issues
- Verify session files exist and are valid

## License

Internal use only - WUKR Wire Daily Dispatch System

---

**Created:** February 11, 2026  
**Script Version:** post_caribbean_tourism_now.mjs  
**Status:** ✅ Ready for testing
