# WUKR Wire Caribbean Tourism Posting System

**Automated content syndication to Substack and Twitter for 320 Caribbean tourism businesses**

## Overview

This system automatically posts **2 Caribbean tourism articles** at scheduled times throughout the day:

- **9:00 AM AST** - Posts 1-2
- **1:00 PM AST** - Posts 3-4  
- **6:00 PM AST** - Posts 5-6

The system intelligently rotates through 6 pre-written articles, tracking posting history to ensure even distribution and avoid duplicates.

## Features

### ✅ Intelligent Rotation Logic
- Tracks which posts have been published and when
- Automatically selects the least-recently-posted content
- Ensures all 6 posts are rotated evenly before repeating
- Prevents duplicate content from being posted too frequently

### ✅ Multi-Platform Publishing
- **Substack**: Full article with title, subtitle, and formatted content (primary platform)
- **Twitter**: Concise 280-character summary with link to Substack article

### ✅ Session Management
- Saves Substack and Twitter login sessions for autonomous operation
- No need to log in manually for each run (after initial setup)

### ✅ Error Handling
- Graceful failure handling for each platform
- Detailed logging of all posting attempts
- Continues posting even if one platform fails

### ✅ Dry-Run Mode
- Test the system without actually posting
- Verify content formatting and rotation logic
- Safe for development and debugging

## File Structure

```
quintapoo-memory/
├── content/
│   └── daily_posts_caribbean_tourism.md    # 6 pre-written articles
├── scripts/
│   ├── post_caribbean_wukr.mjs             # Main posting script (NEW)
│   ├── run_caribbean_posting.sh            # Shell wrapper for scheduling
│   ├── posting_history.json                # Rotation tracking database
│   └── README_CARIBBEAN_TOURISM.md         # Documentation
├── logs/
│   └── caribbean_posting_YYYYMMDD.log      # Daily logs
└── WUKR_CARIBBEAN_POSTING_GUIDE.md         # This file
```

## Initial Setup

### 1. Install Dependencies

The system requires Playwright for browser automation:

```bash
cd /home/ubuntu/quintapoo-memory
pnpm add playwright
pnpm exec playwright install chromium
```

### 2. First-Time Login (Substack)

You need to log in to Substack **once** to save your session:

```bash
# Run with visible browser to perform login
HEADLESS=false node scripts/post_caribbean_wukr.mjs --setup-login --dry-run
```

When the browser opens:
1. Navigate to your Substack publish page
2. Log in with your credentials
3. The script will save your session to `~/.substack-session.json`
4. Future runs will use this saved session

### 3. First-Time Login (Twitter)

Similarly for Twitter:

```bash
# Run with visible browser to perform login
HEADLESS=false node scripts/post_caribbean_wukr.mjs --setup-login --dry-run
```

When the browser opens:
1. Navigate to Twitter/X
2. Log in with your credentials
3. The script will save your session to `~/.twitter-session.json`
4. Future runs will use this saved session

**Note**: Twitter session management can be complex. You may need to refresh the session periodically.

## Usage

### Basic Usage

Post 2 articles to both platforms:

```bash
cd /home/ubuntu/quintapoo-memory
node scripts/post_caribbean_wukr.mjs
```

### Dry-Run Mode (Testing)

Test without actually posting:

```bash
node scripts/post_caribbean_wukr.mjs --dry-run
```

This will:
- Show which posts would be selected
- Display the formatted content
- Show the Twitter text (with character count)
- Not actually post anything

### Custom Post Count

Post a different number of articles:

```bash
node scripts/post_caribbean_wukr.mjs --count=1  # Post only 1 article
node scripts/post_caribbean_wukr.mjs --count=3  # Post 3 articles
```

### Using the Shell Wrapper

The shell wrapper provides logging and error handling:

```bash
./scripts/run_caribbean_posting.sh           # Normal posting
./scripts/run_caribbean_posting.sh --dry-run # Test mode
```

Logs are saved to: `/home/ubuntu/quintapoo-memory/logs/caribbean_posting_YYYYMMDD.log`

## Scheduling with Cron-Job.org

To automate posting at specific times, use [cron-job.org](https://cron-job.org):

### Setup Instructions

1. **Create a webhook endpoint** (if needed) or use SSH/command execution
2. **Add three cron jobs** with these schedules:
   - **9:00 AM AST**: `0 9 * * *` (Atlantic Time)
   - **1:00 PM AST**: `0 13 * * *`
   - **6:00 PM AST**: `0 18 * * *`

3. **Command to execute**:
   ```bash
   cd /home/ubuntu/quintapoo-memory && ./scripts/run_caribbean_posting.sh
   ```

### Alternative: Local Cron

If running on a server with cron access:

```bash
# Edit crontab
crontab -e

# Add these lines (adjust timezone as needed)
0 9 * * * cd /home/ubuntu/quintapoo-memory && ./scripts/run_caribbean_posting.sh
0 13 * * * cd /home/ubuntu/quintapoo-memory && ./scripts/run_caribbean_posting.sh
0 18 * * * cd /home/ubuntu/quintapoo-memory && ./scripts/run_caribbean_posting.sh
```

## Content Management

### Editing Posts

The 6 Caribbean tourism posts are stored in:
```
/home/ubuntu/quintapoo-memory/content/daily_posts_caribbean_tourism.md
```

Each post has this structure:

```markdown
## Post N: [Topic Name]

**Title:** [Article Title]

**Subtitle:** [Article Subtitle]

**Content:**

[Full article content...]

**Sources:** [Source citations]

**Tags:** #Tag1 #Tag2 #Tag3
```

### Adding New Posts

To add more posts:
1. Edit `daily_posts_caribbean_tourism.md`
2. Add new posts following the same format
3. Update the script's post count logic if needed

### Rotation Logic

The system selects posts based on:
1. **Never posted** - Posts that have never been published get priority
2. **Least posted** - Posts with the lowest post count
3. **Oldest** - Posts with the oldest `lastPostedAt` timestamp
4. **Sequential** - Post number as a tiebreaker

This ensures even distribution across all posts.

## Monitoring and Troubleshooting

### Check Posting History

View the posting history database:

```bash
cat /home/ubuntu/quintapoo-memory/scripts/posting_history.json
```

This shows:
- Which posts have been published
- How many times each post has been published
- URLs for Substack and Twitter posts
- Full posting history log

### View Logs

Check the daily logs:

```bash
# Today's log
tail -f /home/ubuntu/quintapoo-memory/logs/caribbean_posting_$(date +%Y%m%d).log

# All logs
ls -lh /home/ubuntu/quintapoo-memory/logs/
```

### Common Issues

#### Issue: "Login required" error

**Solution**: Re-run the setup with visible browser:
```bash
HEADLESS=false node scripts/post_caribbean_wukr.mjs --setup-login --dry-run
```

#### Issue: Session expired

**Solution**: Delete the session file and re-login:
```bash
rm ~/.substack-session.json
rm ~/.twitter-session.json
HEADLESS=false node scripts/post_caribbean_wukr.mjs --setup-login --dry-run
```

#### Issue: Content not parsing correctly

**Solution**: Verify the markdown format in `daily_posts_caribbean_tourism.md` matches the expected structure.

#### Issue: Twitter character limit exceeded

**Solution**: The script automatically trims tweets to 280 characters. Check the dry-run output to verify formatting.

### Testing the System

Before going live, always test with dry-run:

```bash
# Test the full workflow
node scripts/post_caribbean_wukr.mjs --dry-run

# Check which posts would be selected
node scripts/post_caribbean_wukr.mjs --dry-run --count=6
```

## Platform-Specific Notes

### Substack
- Posts are created as drafts first, then published
- The script waits for the publish confirmation
- URLs are captured from the browser after publishing
- Session cookies are saved for autonomous operation

### Twitter/X
- Tweets are limited to 280 characters
- The script automatically creates a summary with:
  - Emoji (🏝️)
  - Article title
  - First sentence or key insight
  - Link to Substack article
  - Hashtags (#CaribbeanTourism #TravelBusiness)
- Twitter sessions may need periodic refresh

## Advanced Configuration

### Environment Variables

- `HEADLESS=false` - Show browser window (useful for debugging)
- `HEADLESS=true` - Run browser in headless mode (default for automation)

### Script Arguments

- `--dry-run` - Test mode, no actual posting
- `--setup-login` - Force login flow to refresh sessions
- `--count=N` - Post N articles instead of default 2

### Customizing the Script

The script is modular and can be extended:

- **SubstackPoster class** - Handles Substack posting logic
- **TwitterPoster class** - Handles Twitter posting logic
- **PostingDatabase class** - Manages rotation and history
- **ContentParser class** - Parses markdown content

Edit `/home/ubuntu/quintapoo-memory/scripts/post_caribbean_wukr.mjs` to customize behavior.

## Success Metrics

Track these metrics to measure success:

1. **Posting Consistency**: Are all 3 daily posting slots being executed?
2. **Rotation Balance**: Are all 6 posts being rotated evenly?
3. **Platform Success Rate**: What percentage of posts succeed on each platform?
4. **Engagement**: Monitor Substack views and Twitter engagement

## Backup and Recovery

### Backup Posting History

```bash
cp /home/ubuntu/quintapoo-memory/scripts/posting_history.json \
   /home/ubuntu/quintapoo-memory/scripts/posting_history_backup_$(date +%Y%m%d).json
```

### Restore from Backup

```bash
cp /home/ubuntu/quintapoo-memory/scripts/posting_history_backup_YYYYMMDD.json \
   /home/ubuntu/quintapoo-memory/scripts/posting_history.json
```

### Reset Posting History

To start fresh:

```bash
rm /home/ubuntu/quintapoo-memory/scripts/posting_history.json
node scripts/post_caribbean_wukr.mjs --dry-run  # This will reinitialize
```

## Integration with GitHub

The repository is connected to GitHub: `hypnoticproductions/new`

### Commit Changes

```bash
cd /home/ubuntu/quintapoo-memory
git add .
git commit -m "Update Caribbean tourism posting system"
git push origin main
```

### Pull Latest Changes

```bash
cd /home/ubuntu/quintapoo-memory
git pull origin main
```

## Support and Maintenance

### Regular Maintenance Tasks

1. **Weekly**: Check posting logs for errors
2. **Monthly**: Verify session cookies are still valid
3. **Quarterly**: Review and update content in `daily_posts_caribbean_tourism.md`
4. **As needed**: Refresh login sessions if expired

### Getting Help

If you encounter issues:

1. Check the logs: `/home/ubuntu/quintapoo-memory/logs/`
2. Run in dry-run mode to test: `--dry-run`
3. Run with visible browser to debug: `HEADLESS=false`
4. Review posting history: `posting_history.json`

## Roadmap

Future enhancements:

- [ ] Add LinkedIn posting support
- [ ] Add Hashnode and Dev.to syndication
- [ ] Implement engagement tracking
- [ ] Add email notifications for failures
- [ ] Create analytics dashboard
- [ ] Support for custom posting schedules
- [ ] A/B testing for different content formats

---

**Target Audience**: 320 Caribbean tourism businesses  
**Posting Frequency**: 6 posts per day (2 posts × 3 time slots)  
**Platforms**: Substack (primary), Twitter (secondary)  
**Automation**: Fully autonomous with session persistence  

**Last Updated**: February 8, 2026
