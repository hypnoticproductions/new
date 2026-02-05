# Caribbean Tourism Content Posting Guide

## Overview

This system posts **2 Caribbean tourism articles** to **Substack and Twitter** using intelligent rotation logic to avoid duplicates. It targets **320 Caribbean tourism businesses** with high-quality, relevant content.

## Quick Start

### 1. One-Time Setup (Login Sessions)

You need to save your login sessions for Substack and Twitter once:

```bash
cd /home/ubuntu/quintapoo-memory
node scripts/post_caribbean_now.mjs --setup-login
```

This will:
- Open a browser window for Substack
- Wait 60 seconds for you to log in
- Save your session cookies to `~/.substack-session.json`
- Open a browser window for Twitter
- Wait 60 seconds for you to log in  
- Save your session cookies to `~/.twitter-session.json`

**Note:** You only need to do this once. The sessions will be reused for future posts.

### 2. Post Content (Dry Run First)

Test the posting workflow without actually publishing:

```bash
cd /home/ubuntu/quintapoo-memory
node scripts/post_caribbean_now.mjs --dry-run
```

This will show you:
- Which posts will be published
- The exact content that will be posted
- The rotation logic in action
- No actual posting happens

### 3. Post Content (Live)

When you're ready to post for real:

```bash
cd /home/ubuntu/quintapoo-memory
node scripts/post_caribbean_now.mjs
```

This will:
- Select the next 2 posts based on rotation logic
- Post to Substack first
- Post to Twitter with a link to the Substack article
- Save posting history to avoid duplicates
- Display a summary of published URLs

## Rotation Logic

The script uses intelligent rotation to ensure fair distribution:

1. **Never published posts** come first
2. **Least published posts** come next (by post count)
3. **Oldest published posts** come after that (by last posted date)
4. **Post number** is used as a tiebreaker

This ensures all 6 posts get equal exposure over time.

## Content Files

### Source Content
- **Location:** `/home/ubuntu/quintapoo-memory/content/daily_posts_caribbean_tourism.md`
- **Format:** 6 Caribbean tourism posts with titles, subtitles, content, and tags
- **Target Audience:** 320 Caribbean tourism businesses

### Posting History
- **Location:** `/home/ubuntu/quintapoo-memory/scripts/posting_history.json`
- **Purpose:** Tracks which posts have been published and when
- **Format:** JSON with posts array and history array

## Posting Schedule

Based on your requirements, you can run this script **3 times per day**:

- **9:00 AM AST** - Posts 1-2
- **1:00 PM AST** - Posts 3-4  
- **6:00 PM AST** - Posts 5-6

The rotation logic ensures the right posts are selected each time.

## Automation Options

### Option 1: Cron Jobs (Recommended)

Add to your crontab:

```bash
# Caribbean Tourism Posting Schedule (AST = UTC-4)
# 9 AM AST = 1 PM UTC
0 13 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_now.mjs >> /var/log/caribbean_posting.log 2>&1

# 1 PM AST = 5 PM UTC
0 17 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_now.mjs >> /var/log/caribbean_posting.log 2>&1

# 6 PM AST = 10 PM UTC
0 22 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_now.mjs >> /var/log/caribbean_posting.log 2>&1
```

### Option 2: Manual Execution

Run the script manually whenever you want to post:

```bash
cd /home/ubuntu/quintapoo-memory
node scripts/post_caribbean_now.mjs
```

### Option 3: GitHub Actions

Create `.github/workflows/caribbean-posting.yml`:

```yaml
name: Caribbean Tourism Posting

on:
  schedule:
    # 9 AM AST (1 PM UTC)
    - cron: '0 13 * * *'
    # 1 PM AST (5 PM UTC)
    - cron: '0 17 * * *'
    # 6 PM AST (10 PM UTC)
    - cron: '0 22 * * *'
  workflow_dispatch:

jobs:
  post:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: npm install
      - run: node scripts/post_caribbean_now.mjs
        env:
          SUBSTACK_SESSION: ${{ secrets.SUBSTACK_SESSION }}
          TWITTER_SESSION: ${{ secrets.TWITTER_SESSION }}
```

## Troubleshooting

### Session Expired

If you see "No saved session found" warnings:

```bash
node scripts/post_caribbean_now.mjs --setup-login
```

This will refresh your login sessions.

### Content Not Found

If posts aren't being found:

1. Check that the content file exists:
   ```bash
   ls -la /home/ubuntu/quintapoo-memory/content/daily_posts_caribbean_tourism.md
   ```

2. Verify the content format matches the expected structure:
   ```markdown
   ## Post 1: Title Here
   
   **Title:** Full Title
   **Subtitle:** Subtitle text
   **Content:**
   
   Content goes here...
   
   **Tags:** #Tag1 #Tag2
   ```

### Posting Fails

If posting fails:

1. Check the error message in the output
2. Verify your internet connection
3. Check if Substack/Twitter are accessible
4. Re-run the setup login process
5. Try a dry-run first to see what would be posted

### Rotation Not Working

If the same posts keep getting selected:

1. Check the posting history file:
   ```bash
   cat /home/ubuntu/quintapoo-memory/scripts/posting_history.json
   ```

2. Verify the `lastPostedAt` and `postCount` fields are being updated

3. Reset the posting history if needed:
   ```bash
   rm /home/ubuntu/quintapoo-memory/scripts/posting_history.json
   node scripts/post_caribbean_now.mjs --dry-run
   ```

## Features

### ✅ Intelligent Rotation
- Automatically selects the next 2 posts based on publishing history
- Ensures all 6 posts get equal exposure
- Prevents duplicate posting

### ✅ Multi-Platform Support
- Posts to Substack (long-form content)
- Posts to Twitter (short summary with link)
- Twitter posts include link back to Substack article

### ✅ Session Management
- Saves login sessions for autonomous operation
- No need to log in every time
- Sessions persist across runs

### ✅ Posting History
- Tracks every post to every platform
- Records URLs for future reference
- Logs errors for debugging

### ✅ Dry Run Mode
- Test before posting
- See exactly what will be published
- No risk of accidental posts

### ✅ Target Audience Tracking
- Optimized for 320 Caribbean tourism businesses
- Content focused on tourism industry insights
- Professional, data-driven articles

## Content Strategy

The 6 Caribbean tourism posts cover:

1. **Tourism Recovery Trends** - Q1 2026 data and insights
2. **Crisis Management** - Hurricane season communication strategies
3. **Digital Marketing** - Social media ROI analysis
4. **Eco-Certification** - Sustainable tourism business case
5. **Labor Shortage Solutions** - Hiring and retention strategies
6. **Tourism Technology** - Essential tools for operators

Each post is designed to provide actionable insights for Caribbean tourism businesses.

## Performance Metrics

Track your posting performance:

```bash
# View posting history
cat /home/ubuntu/quintapoo-memory/scripts/posting_history.json | jq '.history | length'

# Count posts per platform
cat /home/ubuntu/quintapoo-memory/scripts/posting_history.json | jq '.history | group_by(.platform) | map({platform: .[0].platform, count: length})'

# View most recent posts
cat /home/ubuntu/quintapoo-memory/scripts/posting_history.json | jq '.history | sort_by(.postedAt) | reverse | .[0:5]'
```

## Next Steps

1. **Run setup login** to save your Substack and Twitter sessions
2. **Test with dry-run** to verify the content looks good
3. **Post your first batch** of 2 articles
4. **Set up automation** using cron or GitHub Actions
5. **Monitor results** and adjust content as needed

## Support

For issues or questions:
- Check the troubleshooting section above
- Review the posting history JSON file
- Run in dry-run mode to debug
- Check the script output for detailed error messages

---

**Target Audience:** 320 Caribbean tourism businesses  
**Posting Frequency:** 2 posts per execution, 3 times daily  
**Total Daily Posts:** 6 posts across Substack and Twitter  
**Rotation Cycle:** All 6 posts published once before repeating
