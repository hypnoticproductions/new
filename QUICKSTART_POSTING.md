# Caribbean Tourism Posting - Quick Start Guide

## 🚀 Post Right Now

```bash
cd /home/ubuntu/quintapoo-memory
node scripts/post_now.mjs
```

This posts the next 2 articles to Substack and Twitter based on rotation logic.

---

## 🧪 Test First (Dry Run)

```bash
cd /home/ubuntu/quintapoo-memory
node scripts/post_now.mjs --dry-run
```

This shows what would be posted without actually publishing.

---

## 🔐 First-Time Setup (One-Time Only)

### 1. Install Dependencies

```bash
cd /home/ubuntu/quintapoo-memory
pnpm install
npx playwright install chromium
```

### 2. Set Up Browser Sessions

```bash
node scripts/setup_sessions.mjs
```

**Steps:**
1. Browser opens for Substack → Log in → Press ENTER
2. Browser opens for Twitter → Log in → Press ENTER

Sessions are saved to:
- `~/.substack-session.json`
- `~/.twitter-session.json`

---

## 📅 Daily Posting Schedule

| Time | Command |
|------|---------|
| 9:00 AM AST | `node scripts/post_now.mjs` |
| 1:00 PM AST | `node scripts/post_now.mjs` |
| 6:00 PM AST | `node scripts/post_now.mjs` |

Each run posts 2 articles (6 total per day).

---

## 📊 Check Status

### View Posting History

```bash
cat scripts/posting_history.json | jq '.posts'
```

### See Last 5 Posts

```bash
cat scripts/posting_history.json | jq '.history[-5:]'
```

### Count Total Posts

```bash
cat scripts/posting_history.json | jq '.history | length'
```

---

## 🔄 Rotation Logic

The system automatically selects posts based on:

1. **Never posted** → Priority
2. **Least posted** → Next priority
3. **Oldest posted** → Next priority
4. **Post number** → Tiebreaker

**Example Output:**

```
📋 Next 2 posts to publish:
   3. Post 3 (posted 7 times)
   4. Post 4 (posted 7 times)
```

---

## 🛠️ Common Commands

### Post 1 Article Only

```bash
node scripts/post_now.mjs --count=1
```

### Post with Visible Browser (Debug Mode)

```bash
HEADLESS=false node scripts/post_now.mjs
```

### Refresh Sessions (If Login Expires)

```bash
node scripts/setup_sessions.mjs
```

---

## 🚨 Troubleshooting

### "Not logged in to Substack/Twitter"

**Fix:** Re-run session setup
```bash
node scripts/setup_sessions.mjs
```

### "Cannot find package 'playwright'"

**Fix:** Install dependencies
```bash
cd /home/ubuntu/quintapoo-memory
pnpm install
npx playwright install chromium
```

### Posts Not Rotating Correctly

**Fix:** Check posting history
```bash
cat scripts/posting_history.json | jq '.posts[] | {post: .postNumber, count: .postCount}'
```

---

## 🎯 What Gets Posted

### 6 Caribbean Tourism Articles

1. **Tourism Recovery Trends** - Q1 2026 growth statistics
2. **Crisis Management** - Hurricane season communication
3. **Digital Marketing** - Social media ROI analysis
4. **Sustainable Tourism** - Eco-certification benefits
5. **Labor Solutions** - Caribbean tourism labor shortages
6. **Technology Tools** - Essential tech for operators

### Platforms

- **Substack**: Full article with title, subtitle, content
- **Twitter**: 280-char summary + link to Substack

### Target Audience

**320 Caribbean tourism businesses**

---

## 📈 Expected Results

After each run:

✅ 2 articles posted to Substack  
✅ 2 tweets posted to Twitter  
✅ Posting history updated  
✅ Post counts incremented  
✅ Rotation logic applied for next run

---

## 🔮 Automation Setup

### Option 1: Cron (Recommended)

```bash
crontab -e
```

Add these lines:

```cron
0 9 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_now.mjs >> /var/log/caribbean-posts.log 2>&1
0 13 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_now.mjs >> /var/log/caribbean-posts.log 2>&1
0 18 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_now.mjs >> /var/log/caribbean-posts.log 2>&1
```

### Option 2: Manus Scheduler

```javascript
schedule({
  type: 'cron',
  cron: '0 9,13,18 * * *',
  repeat: true,
  name: 'Caribbean Tourism Posts',
  prompt: 'cd /home/ubuntu/quintapoo-memory && node scripts/post_now.mjs'
});
```

---

## 📞 Need Help?

1. Run dry-run mode: `node scripts/post_now.mjs --dry-run`
2. Check posting history: `cat scripts/posting_history.json`
3. Verify sessions exist: `ls -la ~/.substack-session.json ~/.twitter-session.json`
4. Review full guide: `CARIBBEAN_TOURISM_POSTING_IMPLEMENTATION.md`

---

**System Status:** ✅ Ready to post  
**Last Updated:** February 6, 2026
