# Caribbean Tourism Content Posting System - Setup Guide

**Target:** Post 2 Caribbean tourism-focused articles to Substack and Twitter, 3 times daily  
**Audience:** 320 Caribbean tourism businesses  
**Schedule:** 9 AM, 1 PM, 6 PM AST  
**Content:** 6 posts rotating to avoid duplicates

---

## System Overview

This system automatically posts Caribbean tourism content to Substack and Twitter with intelligent rotation logic. The system tracks posting history to ensure even distribution across all 6 posts and prevents duplicates.

### Key Features

- ✅ **Intelligent Rotation**: Posts are selected based on least-posted-first logic
- ✅ **Duplicate Prevention**: JSON-based tracking ensures no post is over-used
- ✅ **Session Persistence**: Login once, post autonomously forever
- ✅ **Multi-Platform**: Substack (primary) → Twitter (with backlink)
- ✅ **Dry Run Mode**: Test without actually posting
- ✅ **Detailed Logging**: Full audit trail of all posting activity

---

## Quick Start

### 1. One-Time Setup (Session Capture)

The system needs valid login sessions for Substack and Twitter. You have two options:

#### Option A: Manual Session Capture (Recommended)

1. **Substack Session:**
   ```bash
   # Open Substack in your browser and log in
   # Then export cookies to the session file
   # (Instructions for browser-specific cookie export below)
   ```

2. **Twitter Session:**
   ```bash
   # Open Twitter/X in your browser and log in
   # Then export cookies to the session file
   # (Instructions for browser-specific cookie export below)
   ```

#### Option B: Use Existing Script (Requires Display Server)

If you have a local environment with display server:
```bash
cd /home/ubuntu/quintapoo-memory
HEADLESS=false node scripts/post_caribbean_rotation.mjs --setup-login
```

This will open browsers for you to log in. The script will capture and save the sessions automatically.

---

## Session File Format

The system expects session files in these locations:
- **Substack**: `~/.substack-session.json`
- **Twitter**: `~/.twitter-session.json`

Each file should contain an array of cookies in this format:

```json
[
  {
    "name": "cookie_name",
    "value": "cookie_value",
    "domain": ".substack.com",
    "path": "/",
    "expires": 1234567890,
    "httpOnly": true,
    "secure": true,
    "sameSite": "Lax"
  }
]
```

### How to Export Cookies from Your Browser

**Chrome/Edge:**
1. Install "EditThisCookie" or "Cookie-Editor" extension
2. Navigate to the logged-in site (Substack or Twitter)
3. Click the extension icon
4. Export cookies as JSON
5. Save to the appropriate file location

**Firefox:**
1. Install "Cookie-Editor" extension
2. Navigate to the logged-in site
3. Click the extension icon → Export
4. Save to the appropriate file location

---

## Usage

### Post 2 Articles Now (Next in Rotation)

```bash
cd /home/ubuntu/quintapoo-memory
node scripts/post_caribbean_rotation.mjs
```

**What happens:**
1. Script loads posting history
2. Selects 2 posts based on rotation logic (least posted first)
3. Posts to Substack (full article with title, subtitle, content)
4. Posts to Twitter (summary with link back to Substack)
5. Updates posting history
6. Displays statistics

### Dry Run (Test Without Posting)

```bash
node scripts/post_caribbean_rotation.mjs --dry-run
```

This shows exactly what would be posted without actually publishing.

### Post Custom Number of Articles

```bash
node scripts/post_caribbean_rotation.mjs --count=3
```

Posts 3 articles instead of the default 2.

### Check Posting Statistics

```bash
cat scripts/posting_history.json | grep -A 5 '"posts"'
```

Shows how many times each post has been published.

---

## Rotation Logic

The system selects posts in this priority order:

1. **Never posted** (null `lastPostedAt`)
2. **Least posted** (lowest `postCount`)
3. **Oldest posted** (oldest `lastPostedAt` timestamp)
4. **Sequential order** (Post 1, 2, 3, etc.)

### Current Status (as of last dry run):

| Post | Title | Times Posted | Last Posted |
|------|-------|--------------|-------------|
| Post 1 | Caribbean Tourism Recovery Trends | 9 | 2026-02-07 |
| Post 2 | Crisis Management for Tourism Operators | 9 | 2026-02-07 |
| Post 3 | Digital Marketing Strategies | 9 | 2026-02-06 |
| Post 4 | Eco-Certification Revenue Impact | 9 | 2026-02-06 |
| Post 5 | Tourism Labor Shortage Solutions | 8 | 2026-02-06 |
| Post 6 | 2026 Tourism Technology Tools | 8 | 2026-02-06 |

**Next to post:** Posts 5 & 6 (lowest count)

---

## Scheduling for Autonomous Operation

### Option 1: Cron Jobs (Linux/Mac)

Edit your crontab:
```bash
crontab -e
```

Add these lines (adjust timezone as needed):
```cron
# Post at 9 AM AST (13:00 UTC)
0 13 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_rotation.mjs >> /var/log/caribbean_posts.log 2>&1

# Post at 1 PM AST (17:00 UTC)
0 17 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_rotation.mjs >> /var/log/caribbean_posts.log 2>&1

# Post at 6 PM AST (22:00 UTC)
0 22 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_rotation.mjs >> /var/log/caribbean_posts.log 2>&1
```

### Option 2: Manus Scheduler

If using Manus AI agent:
```
Schedule task: "Post 2 Caribbean tourism articles" 
Times: 9:00 AM, 1:00 PM, 6:00 PM AST
Command: cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_rotation.mjs
```

---

## Content Management

### Content File Location
`/home/ubuntu/quintapoo-memory/content/daily_posts_caribbean_tourism.md`

### Adding New Posts

1. Edit the content file
2. Add new post section following this format:

```markdown
## Post 7: Your New Post Title

**Title:** Your New Post Title

**Subtitle:** Your compelling subtitle

**Content:**

Your full article content here...

**Sources:** Your sources

**Tags:** #YourHashtags #MoreTags
```

3. Update the script's post parsing logic if needed (currently handles 6 posts)

### Updating Existing Posts

Simply edit the content file. Changes take effect on next run.

---

## Troubleshooting

### "No saved session found" Error

**Problem:** Session files don't exist or are invalid.

**Solution:** 
1. Check if files exist: `ls -la ~/.substack-session.json ~/.twitter-session.json`
2. If missing, capture sessions using the methods above
3. Verify JSON format is correct

### "Login failed" or "Session expired" Error

**Problem:** Session cookies have expired.

**Solution:**
1. Delete old session files: `rm ~/.substack-session.json ~/.twitter-session.json`
2. Capture new sessions
3. Run the script again

### Posts Not Rotating Correctly

**Problem:** Same posts keep getting selected.

**Solution:**
1. Check posting history: `cat scripts/posting_history.json`
2. Verify timestamps are updating
3. If corrupted, backup and reset: 
   ```bash
   cp scripts/posting_history.json scripts/posting_history.backup.json
   # Manually edit or delete to reset
   ```

### Twitter Post Truncated

**Problem:** Twitter posts are cut off.

**Solution:** The script automatically truncates to 280 characters. This is by design. The full content is on Substack, Twitter just has a summary + link.

---

## Platform-Specific Details

### Substack

- **Format:** Full article with title, subtitle, and complete content
- **Publishing:** Posts as "Text post" to your publication
- **URL Pattern:** `https://richarddannibarrifortune.substack.com/p/[slug]`
- **Session Duration:** Typically 30 days

### Twitter/X

- **Format:** Emoji + headline + truncated content + Substack link + hashtags
- **Character Limit:** 280 characters (enforced by script)
- **URL Pattern:** `https://x.com/user/status/[tweet_id]`
- **Session Duration:** Typically 30 days

---

## Posting History Database

The system uses a JSON file (`scripts/posting_history.json`) to track all posting activity.

### Structure

```json
{
  "posts": [
    {
      "id": 1,
      "postNumber": 1,
      "title": "Post 1",
      "lastPostedAt": "2026-02-07T13:04:36.540Z",
      "postCount": 9,
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
      "postedAt": "2026-02-07T13:04:36.540Z"
    }
  ]
}
```

### Resetting History

If you need to start fresh:

```bash
cd /home/ubuntu/quintapoo-memory/scripts
cp posting_history.json posting_history.backup.json
# Edit posting_history.json to reset counts and dates
```

---

## Advanced Configuration

### Environment Variables

- `HEADLESS=false` - Show browser window (requires display server)
- `HEADLESS=true` - Run in headless mode (default, recommended for automation)

### Script Arguments

- `--dry-run` - Test without posting
- `--setup-login` - Launch browsers for login capture
- `--count=N` - Post N articles instead of default 2

### Customizing Content Format

Edit `/home/ubuntu/quintapoo-memory/scripts/post_caribbean_rotation.mjs`:

**Substack formatting:** Lines 276-320  
**Twitter formatting:** Lines 400-450  
**Rotation logic:** Lines 94-121

---

## Monitoring and Analytics

### View Recent Posts

```bash
cd /home/ubuntu/quintapoo-memory
tail -20 scripts/posting_history.json
```

### Count Posts by Platform

```bash
cat scripts/posting_history.json | grep '"platform"' | sort | uniq -c
```

### Check Last Posting Time

```bash
cat scripts/posting_history.json | grep '"postedAt"' | tail -1
```

### Generate Statistics Report

```bash
node scripts/post_caribbean_rotation.mjs --dry-run | grep -A 10 "POSTING STATISTICS"
```

---

## Integration with Other Platforms

The current system focuses on Substack and Twitter, but can be extended to:

- **LinkedIn** (browser automation)
- **Hashnode** (GraphQL API)
- **Dev.to** (REST API)
- **Medium** (browser automation)

To add platforms, modify the script to include additional publisher classes following the existing pattern.

---

## Security Best Practices

1. **Never commit session files to Git**
   - Already in `.gitignore`
   - Session files contain sensitive cookies

2. **Rotate sessions regularly**
   - Capture new sessions every 30 days
   - Delete old sessions after capturing new ones

3. **Use environment-specific credentials**
   - Production sessions on production server only
   - Test sessions on development machines

4. **Monitor for unauthorized access**
   - Check Substack and Twitter login history
   - Revoke sessions if suspicious activity detected

---

## Support and Maintenance

### Updating Dependencies

```bash
cd /home/ubuntu/quintapoo-memory
pnpm update playwright
pnpm exec playwright install chromium
```

### Checking Script Version

```bash
head -20 scripts/post_caribbean_rotation.mjs | grep "version\|@version"
```

### Logs Location

- **Script output:** Console (redirect to file with `>> logfile.log`)
- **Posting history:** `scripts/posting_history.json`
- **Session files:** `~/.substack-session.json`, `~/.twitter-session.json`

---

## Quick Reference Commands

```bash
# Post 2 articles now
node scripts/post_caribbean_rotation.mjs

# Dry run (test)
node scripts/post_caribbean_rotation.mjs --dry-run

# Post 3 articles
node scripts/post_caribbean_rotation.mjs --count=3

# View posting stats
cat scripts/posting_history.json | head -50

# Check next posts to be published
node scripts/post_caribbean_rotation.mjs --dry-run | grep "Selected posts"

# Reset posting history (backup first!)
cp scripts/posting_history.json scripts/posting_history.backup.json
```

---

## Success Criteria

✅ **System is working correctly when:**
- Posts rotate evenly across all 6 articles
- Substack articles publish with full content
- Twitter posts include link back to Substack
- Posting history updates after each run
- No duplicate posts within short timeframes
- Sessions remain valid for 30+ days

---

## Next Steps

1. **Capture login sessions** for Substack and Twitter
2. **Run dry-run test** to verify rotation logic
3. **Post first 2 articles** manually to test
4. **Set up cron jobs** for autonomous operation
5. **Monitor for first week** to ensure stability
6. **Adjust schedule** if needed based on engagement data

---

## Contact and Support

For issues with this system:
1. Check the troubleshooting section above
2. Review the posting history for error messages
3. Test with `--dry-run` to isolate issues
4. Check session file validity

**System Version:** 1.0  
**Last Updated:** February 7, 2026  
**Target Audience:** 320 Caribbean tourism businesses  
**Content Source:** `/content/daily_posts_caribbean_tourism.md`
