# WUKR Wire Dispatch - Quick Start

**Status:** ✅ Ready for deployment  
**Last Updated:** February 12, 2026

## What's Been Built

Fully automated content syndication system that posts to Substack and Twitter:

- **Base 44 Dispatch:** 7:00 AM AST (daily)
- **Caribbean Tourism:** 9 AM, 1 PM, 6 PM AST (6 posts, 3 times daily)

## 3-Step Setup

### 1. Install Dependencies (One-time)

```bash
cd /home/ubuntu/new
pnpm install
pnpm exec playwright install chromium
```

### 2. Set Up Platform Sessions (One-time)

```bash
node scripts/setup_platform_sessions.mjs --platform=all
```

**What happens:**
- Browser opens for Substack login (90 seconds)
- Browser opens for Twitter login (90 seconds)
- Sessions saved to `~/.substack-session.json` and `~/.twitter-session.json`
- Validation confirms sessions work

### 3. Set Up cron-job.org (One-time)

Get your API key from: https://console.cron-job.org → Settings → API

Then create 4 scheduled jobs (or use the manual configuration in the full guide).

## Test Before Going Live

```bash
# Test Caribbean dispatch (dry-run - no actual posting)
node scripts/wukr_dispatch_webhook.mjs --task=caribbean_9am --dry-run

# Test Base 44 dispatch (dry-run)
node scripts/wukr_dispatch_webhook.mjs --task=base44_dispatch --dry-run

# Test live posting (remove --dry-run flag)
node scripts/wukr_dispatch_webhook.mjs --task=caribbean_9am
```

## Manual Posting

```bash
# Manually trigger any task
node scripts/wukr_dispatch_webhook.mjs --task=caribbean_9am
node scripts/wukr_dispatch_webhook.mjs --task=caribbean_1pm
node scripts/wukr_dispatch_webhook.mjs --task=caribbean_6pm
node scripts/wukr_dispatch_webhook.mjs --task=base44_dispatch
```

## Daily Schedule (AST)

| Time    | Task                  | Posts | Platforms          |
|---------|-----------------------|-------|--------------------|
| 7:00 AM | Base 44 Dispatch      | 1     | Substack + Twitter |
| 9:00 AM | Caribbean Tourism     | 2     | Substack + Twitter |
| 1:00 PM | Caribbean Tourism     | 2     | Substack + Twitter |
| 6:00 PM | Caribbean Tourism     | 2     | Substack + Twitter |

**Total:** 7 posts per day

## Database Status

✅ **Supabase Project:** `ebrarmerpzlrbsfpmlkg` (ACTIVE_HEALTHY)  
✅ **Caribbean Posts:** 6 posts loaded and ready  
✅ **Tables Created:**
- `caribbean_tourism_posts` (6 posts, rotation ready)
- `processed_content` (for Base 44 content)
- `posting_history` (tracking all posts)
- `syndication_schedule` (schedule management)
- `platform_credentials` (session tracking)

## Rotation Logic

**Caribbean Tourism:**
- Automatically rotates through all 6 posts
- Posts with `NULL` `lastpostedat` go first (never posted)
- Then posts with lowest `postcount` (least posted)
- Even distribution across all posts

**Base 44:**
- Posts latest unposted content (where `substackurl IS NULL`)
- One article per day at 7 AM AST

## Monitoring

```bash
# Check recent posting history
manus-mcp-cli tool call execute_sql --server supabase --input '{
  "project_id": "ebrarmerpzlrbsfpmlkg",
  "query": "SELECT * FROM posting_history ORDER BY postedat DESC LIMIT 10"
}'

# Check Caribbean post rotation status
manus-mcp-cli tool call execute_sql --server supabase --input '{
  "project_id": "ebrarmerpzlrbsfpmlkg",
  "query": "SELECT postnumber, title, postcount, lastpostedat FROM caribbean_tourism_posts ORDER BY postnumber"
}'
```

## Troubleshooting

**Session expired?**
```bash
node scripts/setup_platform_sessions.mjs --platform=all
```

**Need to test without posting?**
```bash
node scripts/wukr_dispatch_webhook.mjs --task=caribbean_9am --dry-run
```

**See browser during posting?**
```bash
HEADLESS=false node scripts/wukr_dispatch_webhook.mjs --task=caribbean_9am
```

## Files

```
/home/ubuntu/new/
├── scripts/
│   ├── wukr_dispatch_webhook.mjs       # Main dispatch webhook ⭐
│   ├── setup_platform_sessions.mjs     # Session setup ⭐
│   └── schema.sql                      # Database schema
├── content/
│   └── daily_posts_caribbean_tourism.md # 6 Caribbean posts
├── WUKR_WIRE_AUTOMATION_SETUP.md      # Full guide
└── QUICKSTART_WUKR_DISPATCH.md        # This file
```

## Next Steps

1. ✅ Dependencies installed
2. ✅ Database tables created
3. ✅ Scripts tested (dry-run)
4. ⏳ **YOU:** Set up platform sessions
5. ⏳ **YOU:** Provide cron-job.org API key
6. ⏳ **YOU:** Set up cron jobs
7. ⏳ Monitor first automated run

## Support

- **Full Guide:** `/home/ubuntu/new/WUKR_WIRE_AUTOMATION_SETUP.md`
- **GitHub:** https://github.com/hypnoticproductions/new
- **Supabase:** https://supabase.com/dashboard/project/ebrarmerpzlrbsfpmlkg
- **cron-job.org:** https://console.cron-job.org

---

**Built by WUKY** | DOPA-TECH | St. Lucia (The Trenches)
