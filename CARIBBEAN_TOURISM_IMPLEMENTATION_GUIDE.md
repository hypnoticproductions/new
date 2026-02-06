# Caribbean Tourism Content Syndication System - Implementation Guide

**Version:** 2.0 (Live Implementation)  
**Date:** February 6, 2026  
**Target:** 320 Caribbean Tourism Businesses  
**Platforms:** Substack (Primary) + Twitter  
**Posting Schedule:** 3 times daily (9 AM, 1 PM, 6 PM AST)

---

## Executive Summary

This system automates the distribution of 6 Caribbean tourism-focused articles to Substack and Twitter, rotating through the content intelligently to ensure even distribution and avoid duplicates. The system is designed for **maximum autonomy** with minimal user intervention.

### Key Features

- **Intelligent Rotation**: Automatically selects the least-posted content
- **Duplicate Prevention**: JSON-based tracking prevents content fatigue
- **Session Persistence**: Maintains login state across executions
- **Multi-Platform**: Substack (long-form) + Twitter (micro-content)
- **Scheduled Automation**: 3 daily posts at optimal times for Caribbean audience
- **Zero Database Dependency**: Uses lightweight JSON for tracking

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Content Source                           │
│         content/daily_posts_caribbean_tourism.md            │
│                    (6 Posts)                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                Content Parser                               │
│         scripts/parse_content.mjs                           │
│  - Extracts structured data from markdown                   │
│  - Generates Twitter-optimized versions                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Posting Database                               │
│         scripts/posting_history.json                        │
│  - Tracks post counts and timestamps                        │
│  - Implements rotation logic                                │
│  - Prevents duplicates                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            Main Posting Script                              │
│         scripts/post_caribbean_live.mjs                     │
│  - Playwright browser automation                            │
│  - Session management                                       │
│  - Error handling & recovery                                │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌──────────────┐          ┌──────────────┐
│   Substack   │          │   Twitter    │
│   Publisher  │          │   Publisher  │
│              │          │              │
│ Long-form    │          │ 280 chars    │
│ Articles     │          │ Micro-posts  │
└──────────────┘          └──────────────┘
```

---

## Installation & Setup

### Prerequisites

1. **Node.js** (v22.13.0 or higher)
2. **pnpm** package manager
3. **Playwright** with Chromium browser
4. **Git** for version control

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
cd /home/ubuntu
gh repo clone hypnoticproductions/new
cd new

# Install dependencies
pnpm install

# Install Playwright browsers
pnpm exec playwright install chromium
```

### Step 2: Verify Content File

The content file should already exist at:
```
content/daily_posts_caribbean_tourism.md
```

This file contains 6 Caribbean tourism posts with:
- Title
- Subtitle
- Full content (1000-2000 words)
- Sources
- Tags

### Step 3: Initial Login Setup

**IMPORTANT:** The system requires you to log in to Substack and Twitter **once** to establish session persistence.

#### Option A: Manual Login (Recommended for First Time)

```bash
# Run the script in non-headless mode for first login
HEADLESS=false node scripts/post_caribbean_live.mjs --dry-run --count=1
```

The browser will open. Log in to:
1. **Substack** at https://richarddannibarrifortune.substack.com
2. **Twitter** at https://x.com

The script will save your session cookies to:
- `~/.substack-session.json`
- `~/.twitter-session.json`

#### Option B: Session Files Already Exist

If you've logged in before, the session files should persist. Verify they exist:

```bash
ls -lh ~/.substack-session.json ~/.twitter-session.json
```

---

## Usage

### Manual Posting (Testing)

#### Dry Run (No Actual Posting)

```bash
cd /home/ubuntu/new
node scripts/post_caribbean_live.mjs --dry-run --count=2
```

This will:
- Parse the content
- Select the next 2 posts based on rotation logic
- Simulate posting (no actual publish)
- Update the posting history

#### Live Posting (Actual Publish)

```bash
cd /home/ubuntu/new
node scripts/post_caribbean_live.mjs --count=2
```

This will:
- Post to Substack (long-form article)
- Post to Twitter (280-char version)
- Update posting history
- Save session cookies

#### Platform-Specific Posting

```bash
# Substack only
node scripts/post_caribbean_live.mjs --platforms=substack --count=2

# Twitter only
node scripts/post_caribbean_live.mjs --platforms=twitter --count=2

# Both (default)
node scripts/post_caribbean_live.mjs --platforms=substack,twitter --count=2
```

---

## Automated Scheduling

### Schedule Overview

The system posts **2 articles** at each time slot, rotating through all 6 posts:

| Time (AST) | Time (UTC) | Posts | Target Audience Activity |
|------------|------------|-------|--------------------------|
| 9:00 AM    | 1:00 PM    | 1-2   | Morning coffee, planning |
| 1:00 PM    | 5:00 PM    | 3-4   | Lunch break, browsing    |
| 6:00 PM    | 10:00 PM   | 5-6   | Evening, after work      |

**Total:** 6 posts per day, each post rotates evenly.

### Install Cron Jobs

```bash
cd /home/ubuntu/new/scripts
./schedule_caribbean_posts.sh install
```

This will create 3 cron jobs:
- **9:00 AM AST** (13:00 UTC): Post 2 articles
- **1:00 PM AST** (17:00 UTC): Post 2 articles
- **6:00 PM AST** (22:00 UTC): Post 2 articles

### Check Schedule Status

```bash
cd /home/ubuntu/new/scripts
./schedule_caribbean_posts.sh status
```

Output shows:
- Cron job installation status
- Recent log files
- Posting history statistics

### View Logs

Logs are saved to `/home/ubuntu/new/logs/`:

```bash
# Morning posts log
tail -f /home/ubuntu/new/logs/morning.log

# Afternoon posts log
tail -f /home/ubuntu/new/logs/afternoon.log

# Evening posts log
tail -f /home/ubuntu/new/logs/evening.log
```

### Uninstall Cron Jobs

```bash
cd /home/ubuntu/new/scripts
./schedule_caribbean_posts.sh uninstall
```

---

## Rotation Logic

The system uses intelligent rotation to ensure even distribution:

### Priority Order

1. **Never Posted**: Posts that have never been published get highest priority
2. **Least Posted**: Posts with the lowest post count
3. **Oldest Posted**: Posts with the oldest `lastPostedAt` timestamp
4. **Sequential**: Post number (1-6) as final tiebreaker

### Example Rotation

**Day 1:**
- 9 AM: Posts 1, 2 (count: 0 → 1)
- 1 PM: Posts 3, 4 (count: 0 → 1)
- 6 PM: Posts 5, 6 (count: 0 → 1)

**Day 2:**
- 9 AM: Posts 1, 2 (count: 1 → 2)
- 1 PM: Posts 3, 4 (count: 1 → 2)
- 6 PM: Posts 5, 6 (count: 1 → 2)

All posts rotate evenly, preventing content fatigue.

---

## Content Structure

### The 6 Caribbean Tourism Posts

1. **Caribbean Tourism Recovery Trends**
   - Focus: Q1 2026 growth, digital nomads, sustainability
   - Length: ~1,200 words

2. **Crisis Management for Caribbean Tourism Operators**
   - Focus: Hurricane season communication strategies
   - Length: ~1,500 words

3. **Digital Marketing Strategies for Caribbean Tourism**
   - Focus: Social media ROI (Instagram, TikTok, Facebook)
   - Length: ~2,000 words

4. **Sustainable Tourism Certification Benefits**
   - Focus: Eco-certification ROI (31% revenue increase)
   - Length: ~1,800 words

5. **Solving the Caribbean Tourism Labor Shortage**
   - Focus: Recruitment, training, retention strategies
   - Length: ~1,600 words

6. **2026 Tourism Technology: Essential Tools**
   - Focus: PMS, booking engines, AI chatbots, ROI
   - Length: ~2,200 words

### Twitter Optimization

Each post is automatically converted to a 280-character tweet:

```
🌴 [Title]

[Subtitle or key insight]

#Tag1 #Tag2
```

Example:
```
🌴 Caribbean Tourism Shows Strong Recovery in Q1 2026

Regional arrivals up 23% compared to 2025, led by digital nomad programs

#CaribbeanTourism #TravelTrends
```

---

## Posting History & Tracking

### Database File

Location: `scripts/posting_history.json`

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
      "postedAt": "2026-02-05T22:04:18.528Z"
    }
  ]
}
```

### View Statistics

```bash
cd /home/ubuntu/new/scripts
cat posting_history.json | jq '.posts[] | {postNumber, postCount, lastPostedAt}'
```

---

## Error Handling & Recovery

### Session Expiration

**Symptom:** Script fails with "Not logged in" error

**Solution:**
```bash
# Re-run with browser visible to log in again
HEADLESS=false node scripts/post_caribbean_live.mjs --dry-run --count=1
```

Log in when prompted. The script will save new session cookies.

### Browser Automation Failures

**Symptom:** "Element not found" or timeout errors

**Solution:**
1. Check if Substack/Twitter UI has changed
2. Update selectors in `post_caribbean_live.mjs`
3. Run in non-headless mode to debug:
   ```bash
   HEADLESS=false node scripts/post_caribbean_live.mjs --count=1
   ```

### Posting History Corruption

**Symptom:** Rotation logic not working correctly

**Solution:**
```bash
# Backup current history
cp scripts/posting_history.json scripts/posting_history.backup.json

# Reset (will reinitialize)
rm scripts/posting_history.json
node scripts/post_caribbean_live.mjs --dry-run --count=1
```

---

## Monitoring & Maintenance

### Daily Checks

1. **Verify Posts Published**
   - Check Substack: https://richarddannibarrifortune.substack.com
   - Check Twitter: https://x.com/[your_username]

2. **Review Logs**
   ```bash
   tail -20 /home/ubuntu/new/logs/morning.log
   tail -20 /home/ubuntu/new/logs/afternoon.log
   tail -20 /home/ubuntu/new/logs/evening.log
   ```

3. **Check Posting Stats**
   ```bash
   cd /home/ubuntu/new/scripts
   ./schedule_caribbean_posts.sh status
   ```

### Weekly Maintenance

1. **Verify Session Validity**
   ```bash
   # Test login status
   node scripts/post_caribbean_live.mjs --dry-run --count=1
   ```

2. **Review Rotation Balance**
   - All posts should have similar post counts
   - If imbalanced, check rotation logic

3. **Archive Old Logs**
   ```bash
   cd /home/ubuntu/new/logs
   tar -czf logs-$(date +%Y%m%d).tar.gz *.log
   rm *.log
   ```

### Monthly Tasks

1. **Update Content** (if needed)
   - Edit `content/daily_posts_caribbean_tourism.md`
   - Add new posts or update existing ones
   - Test with dry run

2. **Review Analytics**
   - Substack subscriber growth
   - Twitter engagement metrics
   - Adjust posting times if needed

---

## Extending the System

### Adding More Platforms

The system is designed to be extensible. To add LinkedIn, Hashnode, or Dev.to:

1. Create a new publisher class (e.g., `LinkedInPublisher`)
2. Implement `initialize()`, `publish()`, and `close()` methods
3. Add platform to `CONFIG.platforms`
4. Update posting history structure

Example structure:
```javascript
class LinkedInPublisher {
    async initialize() { /* Load session */ }
    async publish(post) { /* Post to LinkedIn */ }
    async close() { /* Cleanup */ }
}
```

### Customizing Posting Times

Edit `scripts/schedule_caribbean_posts.sh`:

```bash
# Change from 9 AM AST to 8 AM AST
# 8 AM AST = 12:00 PM UTC
0 12 * * * cd $PROJECT_DIR && /usr/bin/node $POSTING_SCRIPT --count=2
```

### Changing Post Count Per Slot

```bash
# Post 3 articles instead of 2
node scripts/post_caribbean_live.mjs --count=3
```

Update cron jobs accordingly.

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "No saved session found" | First run or session expired | Run with `HEADLESS=false` and log in |
| "Element not found" | UI changed | Update selectors in script |
| "Timeout waiting for..." | Slow network or page load | Increase `CONFIG.timeout` |
| Rotation not working | History file corrupted | Reset history file |
| Cron jobs not running | Cron not installed | Install cron: `sudo apt install cron` |

### Debug Mode

Run with verbose output:
```bash
DEBUG=* node scripts/post_caribbean_live.mjs --count=1
```

### Test Individual Components

```bash
# Test content parser only
node scripts/parse_content.mjs

# Test scheduler status
./scripts/schedule_caribbean_posts.sh status

# Test posting (dry run)
./scripts/schedule_caribbean_posts.sh test
```

---

## Security & Best Practices

### Session Files

- **Location**: `~/.substack-session.json`, `~/.twitter-session.json`
- **Permissions**: `chmod 600 ~/.*.json` (owner read/write only)
- **Backup**: Not recommended (contains sensitive cookies)
- **Expiration**: Sessions typically last 30-90 days

### Credentials

- **Never commit** session files to Git
- **Never share** session files
- **Use environment variables** for sensitive config (if needed)

### Git Ignore

Ensure `.gitignore` includes:
```
.substack-session.json
.twitter-session.json
logs/
posting_history.json
```

---

## Performance & Scalability

### Current Capacity

- **Posts per day**: 6 (2 per slot × 3 slots)
- **Platforms**: 2 (Substack + Twitter)
- **Total publishes per day**: 12 (6 posts × 2 platforms)

### Scaling Up

To increase to 18 posts per day (6 posts × 3 times):

1. Change `--count=2` to `--count=6` in cron jobs
2. This will post all 6 posts at each time slot
3. Rotation will cycle through all posts 3 times per day

### Resource Usage

- **CPU**: Minimal (browser automation is efficient)
- **Memory**: ~200-300 MB per execution
- **Disk**: ~10 MB for logs per month
- **Network**: ~5-10 MB per posting session

---

## Backup & Recovery

### Backup Critical Files

```bash
# Create backup directory
mkdir -p /home/ubuntu/backups

# Backup content and history
tar -czf /home/ubuntu/backups/caribbean-tourism-$(date +%Y%m%d).tar.gz \
    /home/ubuntu/new/content/ \
    /home/ubuntu/new/scripts/posting_history.json \
    /home/ubuntu/new/logs/
```

### Restore from Backup

```bash
# Extract backup
tar -xzf /home/ubuntu/backups/caribbean-tourism-YYYYMMDD.tar.gz -C /

# Verify files
ls -lh /home/ubuntu/new/scripts/posting_history.json
```

---

## Support & Contact

### Documentation

- **This Guide**: `/home/ubuntu/new/CARIBBEAN_TOURISM_IMPLEMENTATION_GUIDE.md`
- **Playbook**: Original playbook in project root
- **Scripts README**: `/home/ubuntu/new/scripts/README_CARIBBEAN_TOURISM.md`

### Logs Location

- **Posting Logs**: `/home/ubuntu/new/logs/`
- **Cron Logs**: Check with `grep CRON /var/log/syslog`

### Quick Reference Commands

```bash
# Status check
cd /home/ubuntu/new/scripts && ./schedule_caribbean_posts.sh status

# Manual post (dry run)
cd /home/ubuntu/new && node scripts/post_caribbean_live.mjs --dry-run --count=2

# Manual post (live)
cd /home/ubuntu/new && node scripts/post_caribbean_live.mjs --count=2

# View logs
tail -f /home/ubuntu/new/logs/morning.log

# Install cron
cd /home/ubuntu/new/scripts && ./schedule_caribbean_posts.sh install
```

---

## Changelog

### Version 2.0 (February 6, 2026)
- ✅ Implemented Playwright-based browser automation
- ✅ Added session persistence for autonomous operation
- ✅ Created intelligent rotation logic
- ✅ Built JSON-based posting history tracker
- ✅ Added Twitter 280-char optimization
- ✅ Implemented cron-based scheduling
- ✅ Added comprehensive error handling
- ✅ Created monitoring and logging system

### Version 1.0 (Previous)
- Initial implementation with basic posting
- Manual execution only
- Limited error handling

---

## License & Attribution

**Project:** WUKR Wire Caribbean Tourism Syndication  
**Author:** WUKY (Synthetic Co-Founder, DOPA-TECH)  
**Target Audience:** 320 Caribbean Tourism Businesses  
**Content Source:** WUKR Wire Intelligence  

---

**End of Implementation Guide**
