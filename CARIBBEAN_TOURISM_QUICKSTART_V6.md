# Caribbean Tourism Posting System V6 - Quickstart Guide

**Target Audience:** 320 Caribbean Tourism Businesses  
**Platforms:** Substack + Twitter  
**Posting Schedule:** 3 times daily (9 AM, 1 PM, 6 PM AST)  
**Content Rotation:** 6 posts cycling automatically

---

## 🎯 System Overview

This automated system posts Caribbean tourism content to Substack and Twitter with intelligent rotation to ensure all 6 posts get equal exposure. The system tracks posting history to avoid duplicates and automatically selects the least-posted content.

### Key Features

✅ **Intelligent Rotation** - Posts are selected based on:
1. Never posted before (highest priority)
2. Least posted count
3. Oldest last posted date
4. Sequential order

✅ **Duplicate Prevention** - JSON-based tracking prevents re-posting the same content too frequently

✅ **Multi-Platform** - Posts to both Substack (long-form) and Twitter (formatted for 280 chars)

✅ **Session Persistence** - Login once, post autonomously forever (until session expires)

✅ **Error Recovery** - If one platform fails, the other continues

✅ **Scheduling** - Automated posting at 9 AM, 1 PM, and 6 PM AST daily

---

## 🚀 Quick Start (3 Steps)

### Step 1: Set Up Login Sessions

Run the setup command and log in to both platforms:

```bash
cd /home/ubuntu/quintapoo-memory
node scripts/post_caribbean_now_v6.mjs --setup-login
```

**What happens:**
- Browser window opens for Substack → Log in → Press Enter
- Browser window opens for Twitter → Log in → Press Enter
- Sessions saved to `~/.substack-session.json` and `~/.twitter-session.json`

**Note:** You only need to do this once. Sessions persist until they expire (usually weeks/months).

---

### Step 2: Test Manual Posting

Post the next 2 articles manually to verify everything works:

```bash
cd /home/ubuntu/quintapoo-memory
node scripts/post_caribbean_now_v6.mjs --count=2
```

**What happens:**
- Script loads the 6 Caribbean tourism posts from `content/daily_posts_caribbean_tourism.md`
- Selects the next 2 posts based on rotation logic
- Posts to Substack first (gets the canonical URL)
- Posts to Twitter with link back to Substack
- Updates `scripts/posting_history.json` with results

**Expected output:**
```
✅ Published to Substack: https://richarddannibarrifortune.substack.com/p/...
✅ Published to Twitter
✅ Completed Post X
```

---

### Step 3: Enable Automated Scheduling

Install the cron schedule for 3 daily posts:

```bash
cd /home/ubuntu/quintapoo-memory/scripts
./schedule_caribbean_v6.sh install
```

**What happens:**
- Installs 3 cron jobs:
  - **9:00 AM AST** (13:00 UTC) - Posts 1-2
  - **1:00 PM AST** (17:00 UTC) - Posts 3-4  
  - **6:00 PM AST** (22:00 UTC) - Posts 5-6
- Logs saved to `/tmp/caribbean_posting_*.log`

**Verify schedule:**
```bash
./schedule_caribbean_v6.sh status
```

---

## 📊 Monitoring & Management

### Check Posting History

View the complete posting history:

```bash
cd /home/ubuntu/quintapoo-memory/scripts
cat posting_history.json | jq '.history | .[-10:]'  # Last 10 posts
```

### Check Which Posts Are Next

Run a dry-run to see which posts will be published next:

```bash
cd /home/ubuntu/quintapoo-memory
node scripts/post_caribbean_now_v6.mjs --dry-run
```

### View Logs

Check the logs for each posting time:

```bash
# 9 AM posting
tail -f /tmp/caribbean_posting_9am.log

# 1 PM posting
tail -f /tmp/caribbean_posting_1pm.log

# 6 PM posting
tail -f /tmp/caribbean_posting_6pm.log
```

### Check Schedule Status

```bash
cd /home/ubuntu/quintapoo-memory/scripts
./schedule_caribbean_v6.sh status
```

---

## 🛠️ Advanced Usage

### Post Custom Number of Articles

```bash
# Post 1 article
node scripts/post_caribbean_now_v6.mjs --count=1

# Post 3 articles
node scripts/post_caribbean_now_v6.mjs --count=3

# Post all 6 articles (full rotation)
node scripts/post_caribbean_now_v6.mjs --count=6
```

### Test Without Posting (Dry Run)

```bash
node scripts/post_caribbean_now_v6.mjs --dry-run --count=2
```

### Run in Non-Headless Mode (See Browser)

```bash
HEADLESS=false node scripts/post_caribbean_now_v6.mjs --count=2
```

### Disable Scheduling

```bash
cd /home/ubuntu/quintapoo-memory/scripts
./schedule_caribbean_v6.sh uninstall
```

### Re-enable Scheduling

```bash
cd /home/ubuntu/quintapoo-memory/scripts
./schedule_caribbean_v6.sh install
```

---

## 📁 File Structure

```
quintapoo-memory/
├── content/
│   └── daily_posts_caribbean_tourism.md    # 6 Caribbean tourism posts
├── scripts/
│   ├── post_caribbean_now_v6.mjs           # Main posting script
│   ├── schedule_caribbean_v6.sh            # Scheduling management
│   └── posting_history.json                # Posting history database
└── ~/.substack-session.json                # Substack login session
└── ~/.twitter-session.json                 # Twitter login session
```

---

## 🔄 How Rotation Works

The system maintains a JSON database (`posting_history.json`) that tracks:

- **Post number** (1-6)
- **Last posted date**
- **Total post count**
- **Platform URLs** (Substack, Twitter)

**Selection Algorithm:**

1. **Priority 1:** Posts never published before
2. **Priority 2:** Posts with lowest post count
3. **Priority 3:** Posts with oldest last posted date
4. **Priority 4:** Sequential order (Post 1, 2, 3, etc.)

**Example:**

```
Post 1: Posted 10 times, last on Feb 5
Post 2: Posted 10 times, last on Feb 6
Post 3: Posted 9 times, last on Feb 4
Post 4: Posted 11 times, last on Feb 3
Post 5: Posted 8 times, last on Feb 6  ← Selected first (lowest count)
Post 6: Never posted                    ← Selected second (never posted)
```

---

## 🐦 Twitter Formatting

The system automatically formats long-form Substack content for Twitter's 280-character limit:

**Format:**
```
🌴 [Title]

[First key insight - truncated to fit]...

#Hashtag1 #Hashtag2

Read more: [Substack URL]
```

**Example:**
```
🌴 Caribbean Tourism Shows Strong Recovery in Q1 2026

Regional arrivals up 23% compared to 2025, led by digital nomad programs...

#CaribbeanTourism #TravelTrends

Read more: https://richarddannibarrifortune.substack.com/p/...
```

---

## 🔐 Session Management

### When to Re-authenticate

You'll need to run `--setup-login` again if:

- Sessions expire (typically after 30-90 days)
- You change passwords
- Platforms force re-authentication
- You see "Not logged in" errors

### Session Files

- `~/.substack-session.json` - Substack cookies and auth tokens
- `~/.twitter-session.json` - Twitter cookies and auth tokens

**Security:** These files contain sensitive session data. Keep them secure.

---

## ⚠️ Troubleshooting

### "Not logged in to Substack/Twitter"

**Solution:** Re-run the login setup:
```bash
node scripts/post_caribbean_now_v6.mjs --setup-login
```

### "Cannot find package 'playwright'"

**Solution:** Install dependencies:
```bash
cd /home/ubuntu/quintapoo-memory
pnpm install playwright
pnpm exec playwright install chromium
```

### Posts not appearing on schedule

**Check cron is running:**
```bash
crontab -l | grep caribbean
```

**Check logs for errors:**
```bash
tail -f /tmp/caribbean_posting_*.log
```

### "No posts found" or parsing errors

**Verify content file exists:**
```bash
cat /home/ubuntu/quintapoo-memory/content/daily_posts_caribbean_tourism.md | head -50
```

### Browser automation fails

**Run in non-headless mode to see what's happening:**
```bash
HEADLESS=false node scripts/post_caribbean_now_v6.mjs --count=1
```

---

## 📈 Success Metrics

Track your syndication success:

1. **Posting Consistency:** Check logs to ensure all 3 daily posts are executing
2. **Platform URLs:** Verify both Substack and Twitter URLs are captured in `posting_history.json`
3. **Rotation Balance:** All 6 posts should have similar post counts over time
4. **Error Rate:** Check logs for failed posts and investigate patterns

**View posting stats:**
```bash
cd /home/ubuntu/quintapoo-memory/scripts
cat posting_history.json | jq '.posts[] | {postNumber, postCount, lastPostedAt}'
```

---

## 🎯 Target Audience Reminder

**320 Caribbean Tourism Businesses** including:
- Hotels & Resorts
- Tour Operators
- Restaurants & Beach Clubs
- Wedding Venues
- Adventure Tourism Companies
- Boutique Accommodations
- Tourism Boards
- Destination Marketing Organizations

**Content Focus:**
- Tourism recovery trends
- Crisis management
- Digital marketing strategies
- Pricing optimization
- Workforce development
- Technology adoption

---

## 🚨 Emergency Commands

### Stop all scheduled posting immediately
```bash
cd /home/ubuntu/quintapoo-memory/scripts
./schedule_caribbean_v6.sh uninstall
```

### Clear posting history (reset rotation)
```bash
cd /home/ubuntu/quintapoo-memory/scripts
rm posting_history.json
node scripts/post_caribbean_now_v6.mjs --dry-run  # Reinitialize
```

### Test a single post without affecting history
```bash
# Use dry-run mode
node scripts/post_caribbean_now_v6.mjs --dry-run --count=1
```

---

## 📞 Support

For issues or questions:
- Check logs: `/tmp/caribbean_posting_*.log`
- Review posting history: `scripts/posting_history.json`
- Test with dry-run: `--dry-run` flag
- Run in visible mode: `HEADLESS=false`

---

## 🎉 Success Checklist

- [ ] Login sessions set up (`--setup-login`)
- [ ] Manual test successful (posted 2 articles)
- [ ] Automated schedule installed (`schedule_caribbean_v6.sh install`)
- [ ] Schedule status verified (`schedule_caribbean_v6.sh status`)
- [ ] Posting history tracking working (`posting_history.json` updated)
- [ ] Both platforms receiving posts (Substack + Twitter)
- [ ] Logs are clean (no errors in `/tmp/caribbean_posting_*.log`)

---

**System Status:** ✅ READY FOR AUTONOMOUS OPERATION

Once all checklist items are complete, the system will run autonomously, posting 6 times per day (2 posts × 3 times) to reach your target audience of 320 Caribbean tourism businesses.
