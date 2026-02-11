# Caribbean Tourism Posting - Quick Start Guide

## 🚀 First Time Setup (One-Time Only)

### 1. Install Dependencies
```bash
cd /home/ubuntu/quintapoo-memory
pnpm install
npx playwright install chromium
```

### 2. Setup Login Sessions
```bash
node scripts/setup_login_sessions.mjs
```
This will open browsers for you to login to Substack and Twitter. Sessions are saved for autonomous operation.

## 📝 Daily Usage

### Post 2 Articles Now
```bash
cd /home/ubuntu/quintapoo-memory
./scripts/post_caribbean.sh
```

### Test Without Posting (Dry Run)
```bash
./scripts/post_caribbean.sh --dry-run
```

### Post to Specific Platform Only
```bash
node scripts/post_caribbean_tourism_now.mjs --platform=substack
node scripts/post_caribbean_tourism_now.mjs --platform=twitter
```

### Post Different Number of Articles
```bash
node scripts/post_caribbean_tourism_now.mjs --count=1
node scripts/post_caribbean_tourism_now.mjs --count=3
```

## 📊 Monitoring

### Check Posting History
```bash
cat scripts/posting_history.json | jq .
```

### View Recent Posts
```bash
cat scripts/posting_history.json | jq '.history[-10:]'
```

### Check Rotation Status
```bash
cat scripts/posting_history.json | jq '.posts[] | {postNumber, title, postCount, lastPosted: .lastPostedAt}'
```

## 🔄 Scheduling (Automated Posting)

### Recommended Schedule
- **9:00 AM AST** - Posts 1-2
- **1:00 PM AST** - Posts 3-4
- **6:00 PM AST** - Posts 5-6

### Using Cron
```bash
crontab -e
```

Add these lines:
```cron
0 9 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_tourism_now.mjs --count=2
0 13 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_tourism_now.mjs --count=2
0 18 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_tourism_now.mjs --count=2
```

## 🔧 Troubleshooting

### "Not logged in" Error
Re-run session setup:
```bash
node scripts/setup_login_sessions.mjs
```

### Session Expired
Sessions last ~30 days. Re-run setup when they expire.

### View Browser During Posting
```bash
HEADLESS=false node scripts/post_caribbean_tourism_now.mjs --dry-run
```

### Reset Rotation (Start Fresh)
```bash
rm scripts/posting_history.json
node scripts/post_caribbean_tourism_now.mjs --dry-run
```

## 📁 Key Files

- **Content Source**: `content/daily_posts_caribbean_tourism.md`
- **Main Script**: `scripts/post_caribbean_tourism_now.mjs`
- **Shell Wrapper**: `scripts/post_caribbean.sh`
- **Session Setup**: `scripts/setup_login_sessions.mjs`
- **Posting History**: `scripts/posting_history.json`
- **Substack Session**: `~/.substack-session.json`
- **Twitter Session**: `~/.twitter-session.json`

## 📖 Full Documentation

See `CARIBBEAN_POSTING_GUIDE_FEB_11.md` for complete documentation.

## 🎯 Target Audience

**320 Caribbean tourism businesses** across the region

## ✅ System Status

- ✅ Content: 6 posts ready
- ✅ Script: Tested and working
- ✅ Rotation: Intelligent duplicate prevention
- ⏳ Sessions: Need to be set up (one-time)

---

**Need Help?** Check the full guide or run with `--dry-run` to test safely.
