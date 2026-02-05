# Caribbean Tourism Autonomous Posting Script

**Script:** `post_caribbean_autonomous.mjs`  
**Purpose:** Autonomous content syndication to Substack and Twitter  
**Target:** 320 Caribbean tourism businesses

---

## Quick Start

### 1. Install Dependencies

```bash
cd /home/ubuntu/quintapoo-memory
pnpm install
npx playwright install chromium
```

### 2. Setup Login Sessions (One-Time)

```bash
node scripts/post_caribbean_autonomous.mjs --setup-login
```

Follow the prompts to log in to Substack and Twitter. Sessions are saved for future autonomous runs.

### 3. Test with Dry Run

```bash
node scripts/post_caribbean_autonomous.mjs --dry-run
```

### 4. Post Live

```bash
node scripts/post_caribbean_autonomous.mjs
```

---

## Command Options

| Option | Description | Example |
|--------|-------------|---------|
| `--dry-run` | Test without posting | `node scripts/post_caribbean_autonomous.mjs --dry-run` |
| `--setup-login` | Configure login sessions | `node scripts/post_caribbean_autonomous.mjs --setup-login` |
| `--count=N` | Post N articles (default: 2) | `node scripts/post_caribbean_autonomous.mjs --count=4` |
| `HEADLESS=false` | Show browser (debugging) | `HEADLESS=false node scripts/post_caribbean_autonomous.mjs` |

---

## How It Works

### Rotation Algorithm

The script intelligently rotates through 6 Caribbean tourism posts:

1. **Never posted** → highest priority
2. **Least posted** → posts with lowest count
3. **Oldest** → posts not published recently
4. **Sequential** → Post 1, 2, 3, 4, 5, 6

### Content Flow

```
Content File (6 posts)
    ↓
Rotation Logic (select 2)
    ↓
Parse & Format
    ↓
┌─────────────┬─────────────┐
│  Substack   │   Twitter   │
│ (full post) │ (280 chars) │
└─────────────┴─────────────┘
    ↓
Update Posting History
```

### Session Management

- **Substack:** `~/.substack-session.json`
- **Twitter:** `~/.twitter-session.json`
- Sessions persist 30-90 days
- Re-run `--setup-login` if expired

---

## Scheduling

### Recommended Schedule

**3 times daily:**
- 9:00 AM AST (Posts 1-2)
- 1:00 PM AST (Posts 3-4)
- 6:00 PM AST (Posts 5-6)

### Cron Setup

```bash
# Edit crontab
crontab -e

# Add (AST = UTC-4):
0 13 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_autonomous.mjs
0 17 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_autonomous.mjs
0 22 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_autonomous.mjs
```

---

## Monitoring

### Check Current Status

```bash
# View posting statistics
cat scripts/posting_history.json | jq '.posts'

# View recent history
cat scripts/posting_history.json | jq '.history[-5:]'

# Count total posts
cat scripts/posting_history.json | jq '.history | length'
```

### Expected Output

```
📊 Posts to publish: 2
📋 Posts selected for publishing:
   - Post 5: "Post 5" (posted 6 times)
   - Post 6: "Post 6" (posted 6 times)

✅ Post 5 published successfully!
✅ Post 6 published successfully!
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Executable doesn't exist` | Run `npx playwright install chromium` |
| `Cannot find package` | Run `pnpm install` |
| Login errors | Run `node scripts/post_caribbean_autonomous.mjs --setup-login` |
| Posts not appearing | Check session files exist, not in dry-run mode |

---

## Files

- **Script:** `/scripts/post_caribbean_autonomous.mjs`
- **Content:** `/content/daily_posts_caribbean_tourism.md`
- **History:** `/scripts/posting_history.json`
- **Sessions:** `~/.substack-session.json`, `~/.twitter-session.json`

---

## Features

✅ Intelligent rotation (prevents duplicates)  
✅ Session persistence (autonomous operation)  
✅ Multi-platform (Substack + Twitter)  
✅ Dry-run testing  
✅ Error handling & recovery  
✅ Detailed logging  
✅ Posting statistics  

---

**For full documentation, see:** `CARIBBEAN_TOURISM_AUTONOMOUS_GUIDE.md`
