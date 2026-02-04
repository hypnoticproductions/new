# Caribbean Tourism Syndication - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Login to Platforms (First Time Only)

```bash
cd /home/ubuntu/quintapoo-memory
HEADLESS=false node scripts/post_caribbean_tourism_v3.mjs --setup-login
```

**What happens**:
1. Browser opens for Substack → Log in (60 seconds)
2. Browser opens for Twitter → Log in (60 seconds)
3. Sessions saved automatically

### Step 2: Test the System

```bash
# Dry run (no actual posting)
node scripts/post_caribbean_tourism_v3.mjs --dry-run

# Real posting
node scripts/post_caribbean_tourism_v3.mjs
```

### Step 3: Let It Run Automatically

✅ **Already scheduled** to run 3 times daily:
- 9:00 AM AST (Posts 1-2)
- 1:00 PM AST (Posts 3-4)
- 6:00 PM AST (Posts 5-6)

---

## 📊 Monitor Performance

```bash
# Check posting history
cat scripts/posting_history.json | jq '.posts'

# View today's log
tail -f logs/posting_$(date +%Y-%m-%d).log

# See next posts in rotation
node scripts/post_caribbean_tourism_v3.mjs --dry-run | grep "Next posts"
```

---

## 🔧 Common Commands

| Action | Command |
|--------|---------|
| **Post now** | `node scripts/post_caribbean_tourism_v3.mjs` |
| **Test (dry-run)** | `node scripts/post_caribbean_tourism_v3.mjs --dry-run` |
| **Refresh login** | `HEADLESS=false node scripts/post_caribbean_tourism_v3.mjs --setup-login` |
| **Check history** | `cat scripts/posting_history.json \| jq '.posts'` |
| **View logs** | `tail -f logs/posting_$(date +%Y-%m-%d).log` |

---

## 🎯 System Overview

**Target**: 320 Caribbean tourism businesses  
**Platforms**: Substack + Twitter  
**Frequency**: 6 posts/day (2 posts × 3 time slots)  
**Content**: 6 pre-written Caribbean tourism articles  
**Rotation**: Automatic (ensures even distribution)

---

## 🆘 Troubleshooting

### Session Expired?
```bash
HEADLESS=false node scripts/post_caribbean_tourism_v3.mjs --setup-login
```

### Posts Not Rotating Correctly?
```bash
cat scripts/posting_history.json | jq '.posts'
```

### Need to Reset?
```bash
rm scripts/posting_history.json
node scripts/post_caribbean_tourism_v3.mjs --dry-run
```

---

## 📁 Key Files

- **Content**: `content/daily_posts_caribbean_tourism.md`
- **Script**: `scripts/post_caribbean_tourism_v3.mjs`
- **History**: `scripts/posting_history.json`
- **Sessions**: `~/.substack-session.json`, `~/.twitter-session.json`
- **Logs**: `logs/posting_YYYY-MM-DD.log`

---

## ✅ Success Checklist

- [ ] Step 1: Login completed (sessions saved)
- [ ] Step 2: Test successful (dry-run works)
- [ ] Step 3: First real post successful
- [ ] Monitoring: Can view history and logs
- [ ] Scheduled: System running automatically

---

**Need more details?** See `IMPLEMENTATION_GUIDE_V3.md`

**Repository**: `hypnoticproductions/new`  
**Last Updated**: February 4, 2026
