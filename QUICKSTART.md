# Caribbean Tourism Syndication - Quick Start Guide

**Get posting in 5 minutes.**

---

## Prerequisites

- Node.js installed ✓
- pnpm installed ✓
- Playwright installed ✓
- Git access to repository ✓

---

## Step 1: Install Dependencies (30 seconds)

```bash
cd /home/ubuntu/new
pnpm install
pnpm exec playwright install chromium
```

---

## Step 2: First Login (2 minutes)

**You only need to do this ONCE.**

```bash
# Run in visible browser mode
HEADLESS=false node scripts/post_caribbean_live.mjs --dry-run --count=1
```

When the browser opens:
1. **Log in to Substack** at https://richarddannibarrifortune.substack.com
2. **Log in to Twitter** at https://x.com

The script will save your session. Close the browser when done.

---

## Step 3: Test Posting (1 minute)

```bash
# Dry run (no actual posting)
node scripts/post_caribbean_live.mjs --dry-run --count=2
```

You should see:
```
✅ Parsed 6 posts
📋 Posts to publish (2):
   - Post X: [Title] (posted N times)
✅ Caribbean Tourism Syndication Complete!
```

---

## Step 4: Post for Real (30 seconds)

```bash
# Live posting
node scripts/post_caribbean_live.mjs --count=2
```

This will:
- Post 2 articles to Substack
- Post 2 tweets to Twitter
- Update posting history

---

## Step 5: Automate (1 minute)

```bash
cd scripts
./schedule_caribbean_posts.sh install
```

This creates 3 daily posts:
- **9:00 AM AST**: Posts 1-2
- **1:00 PM AST**: Posts 3-4
- **6:00 PM AST**: Posts 5-6

---

## Check Status

```bash
cd scripts
./schedule_caribbean_posts.sh status
```

---

## View Logs

```bash
tail -f /home/ubuntu/new/logs/morning.log
```

---

## Troubleshooting

### "Not logged in" error
```bash
# Re-login
HEADLESS=false node scripts/post_caribbean_live.mjs --dry-run --count=1
```

### Check what will post next
```bash
node scripts/post_caribbean_live.mjs --dry-run --count=2
```

### Uninstall automation
```bash
cd scripts
./schedule_caribbean_posts.sh uninstall
```

---

## That's It!

You now have:
- ✅ 6 Caribbean tourism posts
- ✅ Automated rotation logic
- ✅ Substack + Twitter posting
- ✅ 3 daily posts (9 AM, 1 PM, 6 PM AST)
- ✅ Duplicate prevention
- ✅ Session persistence

**For detailed documentation, see:** `CARIBBEAN_TOURISM_IMPLEMENTATION_GUIDE.md`

---

## Quick Commands Reference

```bash
# Manual post (dry run)
node scripts/post_caribbean_live.mjs --dry-run --count=2

# Manual post (live)
node scripts/post_caribbean_live.mjs --count=2

# Substack only
node scripts/post_caribbean_live.mjs --platforms=substack --count=2

# Twitter only
node scripts/post_caribbean_live.mjs --platforms=twitter --count=2

# Check schedule
cd scripts && ./schedule_caribbean_posts.sh status

# Install automation
cd scripts && ./schedule_caribbean_posts.sh install

# Uninstall automation
cd scripts && ./schedule_caribbean_posts.sh uninstall

# Test (dry run via scheduler)
cd scripts && ./schedule_caribbean_posts.sh test
```

---

**Ready to scale Caribbean tourism content distribution. 🌴**
