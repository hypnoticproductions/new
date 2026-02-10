# Caribbean Tourism V6 - Quick Reference Card

**Target:** 320 Caribbean Tourism Businesses  
**Platforms:** Substack + Twitter  
**Schedule:** 9 AM, 1 PM, 6 PM AST (2 posts each time)

---

## 🚀 Initial Setup (One-Time)

```bash
cd /home/ubuntu/quintapoo-memory

# 1. Set up login sessions
node scripts/post_caribbean_now_v6.mjs --setup-login

# 2. Test posting
node scripts/post_caribbean_now_v6.mjs --count=2

# 3. Enable automation
cd scripts && ./schedule_caribbean_v6.sh install
```

---

## 📊 Daily Operations

### Check Status
```bash
cd /home/ubuntu/quintapoo-memory/scripts
./schedule_caribbean_v6.sh status
```

### View Recent Logs
```bash
tail -20 /tmp/caribbean_posting_9am.log
tail -20 /tmp/caribbean_posting_1pm.log
tail -20 /tmp/caribbean_posting_6pm.log
```

### Check Posting History
```bash
cd /home/ubuntu/quintapoo-memory/scripts
cat posting_history.json | jq '.posts'
```

---

## 🔧 Common Commands

### Manual Post (2 articles)
```bash
cd /home/ubuntu/quintapoo-memory
node scripts/post_caribbean_now_v6.mjs --count=2
```

### Dry Run (Test Without Posting)
```bash
node scripts/post_caribbean_now_v6.mjs --dry-run
```

### See Browser (Non-Headless)
```bash
HEADLESS=false node scripts/post_caribbean_now_v6.mjs --count=1
```

### Stop Automation
```bash
cd /home/ubuntu/quintapoo-memory/scripts
./schedule_caribbean_v6.sh uninstall
```

### Resume Automation
```bash
./schedule_caribbean_v6.sh install
```

---

## 🚨 Troubleshooting

### "Not logged in" Error
```bash
cd /home/ubuntu/quintapoo-memory
node scripts/post_caribbean_now_v6.mjs --setup-login
```

### Check if Cron is Running
```bash
crontab -l | grep caribbean
```

### View All Logs
```bash
ls -lh /tmp/caribbean_posting_*.log
```

### Reset Posting History
```bash
cd /home/ubuntu/quintapoo-memory/scripts
rm posting_history.json
node scripts/post_caribbean_now_v6.mjs --dry-run
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `scripts/post_caribbean_now_v6.mjs` | Main posting script |
| `scripts/schedule_caribbean_v6.sh` | Schedule manager |
| `scripts/posting_history.json` | Posting database |
| `content/daily_posts_caribbean_tourism.md` | 6 posts source |
| `~/.substack-session.json` | Substack login |
| `~/.twitter-session.json` | Twitter login |

---

## ⏰ Posting Schedule

| Time (AST) | Time (UTC) | Posts | Cron |
|------------|------------|-------|------|
| 9:00 AM | 13:00 | 1-2 | `0 13 * * *` |
| 1:00 PM | 17:00 | 3-4 | `0 17 * * *` |
| 6:00 PM | 22:00 | 5-6 | `0 22 * * *` |

---

## 📈 Success Indicators

✅ Logs show "Published to Substack" and "Published to Twitter"  
✅ `posting_history.json` updates after each run  
✅ All 6 posts have similar post counts  
✅ No error messages in logs  
✅ Posts appear on both platforms  

---

## 🔄 Rotation Logic

**Priority Order:**
1. Never posted (highest)
2. Lowest post count
3. Oldest last posted date
4. Sequential order

**Result:** All 6 posts get equal exposure over time.

---

## 📞 Quick Support

**Full Documentation:** `CARIBBEAN_TOURISM_QUICKSTART_V6.md`  
**Executive Summary:** `CARIBBEAN_TOURISM_V6_SUMMARY.md`  
**This Reference:** `CARIBBEAN_V6_QUICK_REFERENCE.md`

---

**Last Updated:** February 10, 2026  
**Version:** 6.0  
**Status:** ✅ PRODUCTION READY
