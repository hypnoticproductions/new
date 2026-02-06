# Caribbean Tourism Content Syndication - Implementation Guide

**WUKR Wire Daily Dispatch**  
**Target Audience:** 320 Caribbean tourism businesses  
**Platforms:** Substack + Twitter  
**Posting Schedule:** 3 times daily (9 AM, 1 PM, 6 PM AST)

---

## 📋 Overview

This system automates the posting of 6 Caribbean tourism-focused articles to Substack and Twitter with intelligent rotation to ensure even distribution and avoid duplicates.

### Key Features

✅ **Intelligent Rotation**: Posts are selected based on least-posted-first logic  
✅ **Duplicate Prevention**: JSON-based tracking prevents re-posting too frequently  
✅ **Multi-Platform**: Simultaneous posting to Substack and Twitter  
✅ **Autonomous Operation**: Runs without user intervention once configured  
✅ **Session Persistence**: Saves browser cookies for seamless automation  
✅ **Dry-Run Testing**: Test mode to verify behavior before live posting

---

## 🗂️ Project Structure

```
/home/ubuntu/quintapoo-memory/
├── content/
│   └── daily_posts_caribbean_tourism.md    # 6 articles for rotation
├── scripts/
│   ├── post_now.mjs                        # Main posting script
│   ├── setup_sessions.mjs                  # Session setup helper
│   ├── posting_history.json                # Tracking database
│   └── schema.sql                          # SQL schema (for future DB migration)
└── CARIBBEAN_TOURISM_POSTING_IMPLEMENTATION.md  # This file
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd /home/ubuntu/quintapoo-memory
pnpm install
npx playwright install chromium
```

### 2. Set Up Browser Sessions (One-Time Setup)

You need to log in to Substack and Twitter once to save session cookies:

```bash
node scripts/setup_sessions.mjs
```

**What happens:**
1. A browser window opens for Substack
2. Log in with your credentials
3. Press ENTER in the terminal to save the session
4. Repeat for Twitter

**Session files saved to:**
- `~/.substack-session.json`
- `~/.twitter-session.json`

### 3. Test in Dry-Run Mode

```bash
node scripts/post_now.mjs --dry-run
```

This simulates posting without actually publishing anything.

### 4. Post Live

```bash
node scripts/post_now.mjs
```

This will:
- Select the next 2 articles based on rotation logic
- Post to Substack first
- Post to Twitter with a link to the Substack article
- Update the posting history

---

## 📅 Posting Schedule

The system is designed to post **2 articles, 3 times per day**:

| Time Slot | Posts | Target Articles |
|-----------|-------|-----------------|
| 9:00 AM AST | 2 | Rotation (e.g., Posts 1-2) |
| 1:00 PM AST | 2 | Rotation (e.g., Posts 3-4) |
| 6:00 PM AST | 2 | Rotation (e.g., Posts 5-6) |

**Total:** 6 posts per day (each of the 6 articles posted once daily)

---

## 🔄 Rotation Logic

The system intelligently selects which posts to publish based on:

1. **Never Posted**: Posts that have never been published take priority
2. **Least Posted**: Posts with the lowest `postCount` are selected next
3. **Oldest Posted**: Posts with the oldest `lastPostedAt` timestamp
4. **Sequential Order**: As a tiebreaker, posts are selected by post number (1-6)

**Example:**

If the posting history shows:
- Post 1: posted 8 times (last: Feb 5, 5:04 PM)
- Post 2: posted 8 times (last: Feb 5, 5:04 PM)
- Post 3: posted 7 times (last: Feb 5, 5:07 PM)
- Post 4: posted 7 times (last: Feb 5, 5:07 PM)
- Post 5: posted 8 times (last: Feb 6, 8:07 AM)
- Post 6: posted 8 times (last: Feb 6, 8:07 AM)

**Next posts selected:** Posts 3 and 4 (lowest count)

---

## 📊 Tracking System

### Posting History Format

The `posting_history.json` file tracks:

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

### Key Metrics

- `postCount`: How many times this post has been published
- `lastPostedAt`: Timestamp of the most recent posting
- `substackUrl`: Latest Substack URL for this post
- `twitterUrl`: Latest Twitter URL for this post

---

## 🛠️ Command Reference

### Post Commands

```bash
# Post next 2 articles (default)
node scripts/post_now.mjs

# Post only 1 article
node scripts/post_now.mjs --count=1

# Test without posting
node scripts/post_now.mjs --dry-run

# Post in visible browser mode (for debugging)
HEADLESS=false node scripts/post_now.mjs
```

### Session Management

```bash
# Set up browser sessions (one-time)
node scripts/setup_sessions.mjs

# Check if sessions exist
ls -la ~/.substack-session.json ~/.twitter-session.json

# Remove expired sessions (to force re-login)
rm ~/.substack-session.json ~/.twitter-session.json
```

### History Management

```bash
# View posting history
cat scripts/posting_history.json | jq '.posts'

# Count total posts
cat scripts/posting_history.json | jq '.history | length'

# View last 5 posts
cat scripts/posting_history.json | jq '.history[-5:]'
```

---

## 🤖 Automation Options

### Option 1: Cron (Linux/Mac)

Add to your crontab:

```bash
# Edit crontab
crontab -e

# Add these lines (adjust timezone as needed)
0 9 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_now.mjs >> /var/log/caribbean-posts.log 2>&1
0 13 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_now.mjs >> /var/log/caribbean-posts.log 2>&1
0 18 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_now.mjs >> /var/log/caribbean-posts.log 2>&1
```

### Option 2: Cron-Job.org (Cloud-Based)

1. Go to [cron-job.org](https://cron-job.org)
2. Create a free account
3. Set up 3 jobs:
   - **9 AM AST**: `curl -X POST https://your-server.com/api/post-caribbean`
   - **1 PM AST**: `curl -X POST https://your-server.com/api/post-caribbean`
   - **6 PM AST**: `curl -X POST https://your-server.com/api/post-caribbean`

### Option 3: Manus Scheduler

Use the Manus scheduling system:

```javascript
// Schedule daily posts at 9 AM, 1 PM, 6 PM AST
schedule({
  type: 'cron',
  cron: '0 9,13,18 * * *',  // 9 AM, 1 PM, 6 PM
  repeat: true,
  name: 'Caribbean Tourism Posts',
  prompt: 'Post 2 Caribbean tourism articles to Substack and Twitter using the rotation script'
});
```

---

## 🎯 Content Strategy

### Target Audience

**320 Caribbean tourism businesses** including:
- Hotels and resorts
- Tour operators
- Restaurants and beach clubs
- Destination marketing organizations
- Travel agencies
- Adventure tourism operators

### Content Themes

The 6 rotating posts cover:

1. **Tourism Recovery Trends** - Q1 2026 growth statistics and digital nomad programs
2. **Crisis Management** - Hurricane season communication strategies
3. **Digital Marketing** - Social media ROI analysis (Instagram, TikTok, Facebook)
4. **Sustainable Tourism** - Eco-certification benefits and revenue impact
5. **Labor Solutions** - Addressing Caribbean tourism labor shortages
6. **Technology Tools** - Essential tech for Caribbean tourism operators

### Platform-Specific Formatting

**Substack:**
- Full article with title, subtitle, and complete content
- Includes sources and citations
- Professional formatting with headers and bullet points

**Twitter:**
- 280-character summary
- Key insight or statistic
- Link to full Substack article
- 1-2 relevant hashtags

---

## 🔍 Monitoring & Maintenance

### Daily Checks

1. **Verify Posts**: Check Substack and Twitter to confirm posts went live
2. **Review History**: `cat scripts/posting_history.json | jq '.posts'`
3. **Check Rotation**: Ensure post counts are balanced across all 6 articles

### Weekly Maintenance

1. **Session Validation**: Test if browser sessions are still valid
2. **Content Updates**: Refresh articles in `content/daily_posts_caribbean_tourism.md`
3. **Analytics Review**: Check engagement metrics on both platforms

### Monthly Tasks

1. **Refresh Sessions**: Re-run `setup_sessions.mjs` to update cookies
2. **Content Rotation**: Add new articles or update existing ones
3. **Performance Analysis**: Review which posts get the most engagement

---

## 🚨 Troubleshooting

### Issue: "Not logged in to Substack"

**Solution:**
```bash
node scripts/setup_sessions.mjs
```
Log in manually and press ENTER to save the session.

### Issue: "Cannot find package 'playwright'"

**Solution:**
```bash
cd /home/ubuntu/quintapoo-memory
pnpm install
npx playwright install chromium
```

### Issue: Posts not rotating correctly

**Solution:**
Check the posting history to see if counts are balanced:
```bash
cat scripts/posting_history.json | jq '.posts[] | {post: .postNumber, count: .postCount}'
```

If imbalanced, you can manually edit `posting_history.json` to reset counts.

### Issue: Twitter character limit exceeded

**Solution:**
The script automatically truncates tweets to 280 characters. If you need more control, edit the `formatTweet()` function in `post_now.mjs`.

---

## 📈 Success Metrics

Track these KPIs to measure effectiveness:

### Substack Metrics
- Views per post
- Subscriber growth rate
- Email open rates
- Click-through rates

### Twitter Metrics
- Impressions per tweet
- Engagement rate (likes, retweets, replies)
- Profile visits
- Link clicks to Substack

### Overall Goals
- Reach 320 Caribbean tourism businesses
- Maintain consistent posting schedule (3x daily)
- Balance post distribution (each article posted equally)
- Increase engagement over time

---

## 🔐 Security Best Practices

1. **Session Files**: Keep `~/.substack-session.json` and `~/.twitter-session.json` private
2. **Git Ignore**: Add session files to `.gitignore`
3. **Regular Rotation**: Refresh sessions monthly
4. **Backup History**: Regularly backup `posting_history.json`

---

## 🔮 Future Enhancements

### Planned Features

1. **Database Migration**: Move from JSON to PostgreSQL for better scalability
2. **LinkedIn Integration**: Add LinkedIn as a third platform
3. **Analytics Dashboard**: Real-time posting and engagement metrics
4. **Content Suggestions**: AI-powered content optimization
5. **A/B Testing**: Test different headlines and formats
6. **Engagement Tracking**: Automatically collect likes, shares, comments

### API Integration Opportunities

- **Hashnode**: Free GraphQL API for blog syndication
- **Dev.to**: REST API for developer-focused content
- **Medium**: Browser automation (high risk, use with caution)

---

## 📞 Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the posting history: `cat scripts/posting_history.json`
3. Run in dry-run mode: `node scripts/post_now.mjs --dry-run`
4. Check session validity: `ls -la ~/.substack-session.json ~/.twitter-session.json`

---

## 📝 Change Log

### v1.0.0 (Feb 6, 2026)
- Initial implementation
- Substack + Twitter posting
- Rotation logic with duplicate prevention
- Session persistence
- Dry-run testing mode

---

**Last Updated:** February 6, 2026  
**System Status:** ✅ Operational  
**Next Scheduled Post:** Check cron schedule or Manus scheduler
