# Caribbean Tourism Syndication Scripts

This directory contains the automation scripts for posting Caribbean tourism content to Substack and Twitter.

## Core Scripts

### `post_caribbean_live.mjs`
**Main posting script** - Handles content parsing, rotation logic, and publishing to Substack and Twitter.

**Usage:**
```bash
node post_caribbean_live.mjs [options]

Options:
  --dry-run              Simulate posting without actually publishing
  --count=N              Number of posts to publish (default: 2)
  --platforms=X,Y        Comma-separated platforms (default: substack,twitter)

Examples:
  node post_caribbean_live.mjs --dry-run --count=2
  node post_caribbean_live.mjs --count=2
  node post_caribbean_live.mjs --platforms=substack --count=1
```

### `parse_content.mjs`
**Content parser** - Extracts structured post data from the markdown file.

**Usage:**
```bash
node parse_content.mjs
```

Outputs JSON with all 6 posts including:
- Title, subtitle, content
- Sources, tags
- Twitter-optimized version (280 chars)

### `schedule_caribbean_posts.sh`
**Scheduler** - Manages cron jobs for automated posting.

**Usage:**
```bash
./schedule_caribbean_posts.sh [command]

Commands:
  install    Install cron jobs for automated posting
  uninstall  Remove cron jobs
  status     Show current status and logs
  test       Run a dry-run test
```

**Schedule:**
- 9:00 AM AST (13:00 UTC): Post 2 articles
- 1:00 PM AST (17:00 UTC): Post 2 articles
- 6:00 PM AST (22:00 UTC): Post 2 articles

## Data Files

### `posting_history.json`
**Posting database** - Tracks which posts have been published and when.

Structure:
```json
{
  "posts": [
    {
      "id": 1,
      "postNumber": 1,
      "title": "Post 1",
      "lastPostedAt": "2026-02-05T22:04:18.565Z",
      "postCount": 8,
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
      "postedAt": "2026-02-05T22:04:18.528Z"
    }
  ]
}
```

## Session Files

Located in home directory:
- `~/.substack-session.json` - Substack login session
- `~/.twitter-session.json` - Twitter login session

**Security:** These files contain sensitive cookies. Never commit to Git.

## Logs

Located in `/home/ubuntu/new/logs/`:
- `morning.log` - 9 AM AST posts
- `afternoon.log` - 1 PM AST posts
- `evening.log` - 6 PM AST posts

## Rotation Logic

Posts are selected based on:
1. Never posted (highest priority)
2. Least posted count
3. Oldest last posted date
4. Sequential post number

This ensures even distribution across all 6 posts.

## Quick Reference

```bash
# Test posting (dry run)
node post_caribbean_live.mjs --dry-run --count=2

# Post for real
node post_caribbean_live.mjs --count=2

# Install automation
./schedule_caribbean_posts.sh install

# Check status
./schedule_caribbean_posts.sh status

# View logs
tail -f /home/ubuntu/new/logs/morning.log
```

## Troubleshooting

### Session expired
```bash
HEADLESS=false node post_caribbean_live.mjs --dry-run --count=1
```
Log in when browser opens.

### Reset posting history
```bash
cp posting_history.json posting_history.backup.json
rm posting_history.json
node post_caribbean_live.mjs --dry-run --count=1
```

## Documentation

See `/home/ubuntu/new/CARIBBEAN_TOURISM_IMPLEMENTATION_GUIDE.md` for full documentation.
