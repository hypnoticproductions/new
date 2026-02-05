# WUKR Wire Daily Dispatch - Quick Start Guide

## 🎯 What This System Does

Automatically posts **2 Caribbean tourism articles** to **Substack** and **Twitter**, **3 times per day**, rotating through 6 high-quality posts to reach **320 Caribbean tourism businesses**.

**Posting Schedule:**
- **9:00 AM AST** → Posts 1-2
- **1:00 PM AST** → Posts 3-4
- **6:00 PM AST** → Posts 5-6

## ⚡ Quick Start (5 Minutes)

### Step 1: Set Up Login Sessions (One-Time Only)

```bash
cd /home/ubuntu/quintapoo-memory
node scripts/post_caribbean_rotation.mjs --setup-login
```

**What happens:**
1. Browser opens for Substack → Log in → Wait 60 seconds → Session saved
2. Browser opens for Twitter → Log in → Wait 60 seconds → Session saved

**You only do this once.** Sessions are saved and reused automatically.

### Step 2: Test the System

```bash
# Dry run (no actual posting)
./scripts/schedule_daily_posts.sh test

# Real test (posts 2 articles)
node scripts/post_caribbean_rotation.mjs --count=2
```

### Step 3: Install Automated Scheduling

```bash
./scripts/schedule_daily_posts.sh install
```

**Done!** The system will now post automatically 3 times per day.

## 📊 Check Status Anytime

```bash
./scripts/schedule_daily_posts.sh status
```

Shows:
- ✅ Cron jobs installed
- ✅ Login sessions active
- 📈 Recent posting history
- 📊 Rotation statistics

## 🔧 Common Commands

```bash
# Manual post (2 articles)
node scripts/post_caribbean_rotation.mjs --count=2

# Dry run test
node scripts/post_caribbean_rotation.mjs --dry-run

# Post custom number
node scripts/post_caribbean_rotation.mjs --count=3

# Check status
./scripts/schedule_daily_posts.sh status

# View logs
tail -f logs/post_9am.log
tail -f logs/post_1pm.log
tail -f logs/post_6pm.log

# Uninstall scheduling
./scripts/schedule_daily_posts.sh uninstall
```

## 📁 Important Files

```
quintapoo-memory/
├── content/
│   └── daily_posts_caribbean_tourism.md    # 6 posts (edit here)
├── scripts/
│   ├── post_caribbean_rotation.mjs         # Main script
│   ├── schedule_daily_posts.sh             # Scheduling
│   └── posting_history.json                # Tracking database
└── logs/
    ├── post_9am.log                        # Morning logs
    ├── post_1pm.log                        # Afternoon logs
    └── post_6pm.log                        # Evening logs
```

## 🎨 What Gets Posted

### Substack
- Full article with title, subtitle, and complete content
- Professional formatting
- Sources and citations
- Captures published URL

### Twitter
- 280 character formatted tweet
- Emoji + headline + insight + Substack URL
- Attribution: "WUKR Wire Intelligence"
- Relevant hashtags

**Example Twitter Post:**
```
🌴 Caribbean Tourism Shows Strong Recovery in Q1 2026

Regional arrivals up 23% compared to 2025, led by digital nomad programs

https://richarddannibarrifortune.substack.com/p/...

WUKR Wire Intelligence
#CaribbeanTourism #TravelTrends
```

## 🔄 How Rotation Works

The system intelligently selects posts based on:

1. **Never posted** → Highest priority
2. **Least posted** → Next priority
3. **Oldest posting date** → Next priority
4. **Sequential order** → Final tiebreaker

This ensures even distribution across all 6 posts.

## 🚨 Troubleshooting

### "Session expired" error
```bash
node scripts/post_caribbean_rotation.mjs --setup-login
```

### "Browser not found" error
```bash
npx playwright install chromium
```

### Cron jobs not running
```bash
sudo service cron status
sudo service cron restart
```

### Check what went wrong
```bash
cat logs/post_9am.log
cat logs/post_1pm.log
cat logs/post_6pm.log
```

## 📈 Monitoring

### View posting statistics
```bash
cat scripts/posting_history.json | jq '.posts'
```

### Count total publications
```bash
cat scripts/posting_history.json | jq '.history | length'
```

### View recent posts
```bash
cat scripts/posting_history.json | jq '.history[-10:]'
```

## 🎯 The 6 Caribbean Tourism Posts

1. **Caribbean Tourism Recovery Trends** - Q1 2026 growth data
2. **Crisis Management** - Hurricane season communication
3. **Digital Marketing** - Social media ROI analysis
4. **Sustainable Tourism** - Eco-certification impact
5. **Workforce Development** - Labor shortage solutions
6. **Tourism Technology** - Essential tools for operators

Each post is 2000-5000 words with professional research and citations.

## 🔐 Security

Session files are stored securely:
- `~/.substack-session.json` - Substack login
- `~/.twitter-session.json` - Twitter login

These files are **NOT** committed to Git and should be kept private.

## 📞 Need Help?

1. Check status: `./scripts/schedule_daily_posts.sh status`
2. Run test: `./scripts/schedule_daily_posts.sh test`
3. View logs: `tail -f logs/*.log`
4. Check history: `cat scripts/posting_history.json`

## 🚀 Next Steps

After initial setup, the system runs autonomously:

- ✅ Posts 2 articles at 9 AM AST
- ✅ Posts 2 articles at 1 PM AST
- ✅ Posts 2 articles at 6 PM AST
- ✅ Rotates through all 6 posts evenly
- ✅ Tracks history to prevent duplicates
- ✅ Logs all activity for monitoring

**Total:** 6 posts per day, reaching 320 Caribbean tourism businesses on Substack and Twitter.

---

**For detailed documentation, see:** `WUKR_WIRE_DAILY_DISPATCH_GUIDE.md`

**Last Updated:** February 5, 2026  
**Version:** 1.0.0
