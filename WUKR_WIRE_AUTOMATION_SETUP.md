# WUKR Wire Daily Dispatch - Complete Setup Guide

**Last Updated:** February 12, 2026  
**Status:** Ready for deployment

## Overview

Automated daily content syndication system that posts to Substack and Twitter:

1. **Base 44 to Substack** - 7:00 AM AST (daily)
2. **Caribbean Tourism Rotation** - 9 AM, 1 PM, 6 PM AST (6 posts, 3 times daily)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     cron-job.org                            │
│  (External scheduler - runs even when sandbox hibernates)   │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTP POST (scheduled times)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│            wukr_dispatch_webhook.mjs                        │
│  (Unified webhook handler for all dispatch tasks)          │
└─────────────────────────────────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                ▼                     ▼
┌───────────────────────┐   ┌──────────────────────┐
│  Base 44 Dispatch     │   │ Caribbean Rotation   │
│  (7 AM AST)           │   │ (9 AM, 1 PM, 6 PM)   │
└───────────────────────┘   └──────────────────────┘
                │                     │
                ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                        │
│  Tables: processed_content, caribbean_tourism_posts,        │
│          posting_history, syndication_schedule              │
└─────────────────────────────────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                ▼                     ▼
┌───────────────────────┐   ┌──────────────────────┐
│  Playwright Browser   │   │  Playwright Browser  │
│  (Substack posting)   │   │  (Twitter posting)   │
└───────────────────────┘   └──────────────────────┘
```

## Prerequisites

### 1. System Requirements

- Node.js 22.13.0 (installed)
- Playwright (install via `pnpm install`)
- Supabase project (active: `ebrarmerpzlrbsfpmlkg`)
- GitHub repository: `hypnoticproductions/new`

### 2. Platform Accounts

- **Substack:** richarddannibarrifortune.substack.com
- **Twitter:** Your Twitter account
- **cron-job.org:** Account with API access

### 3. Environment Setup

```bash
cd /home/ubuntu/new
pnpm install
```

## Step-by-Step Setup

### Phase 1: Install Dependencies

```bash
cd /home/ubuntu/new
pnpm install playwright @supabase/supabase-js
pnpm exec playwright install chromium
```

### Phase 2: Set Up Platform Sessions

This is a **one-time setup**. You'll log in manually once, and the automation will use saved sessions.

#### Option A: Set up both platforms at once

```bash
node scripts/setup_platform_sessions.mjs --platform=all
```

#### Option B: Set up platforms individually

```bash
# Substack only
node scripts/setup_platform_sessions.mjs --platform=substack

# Twitter only
node scripts/setup_platform_sessions.mjs --platform=twitter
```

**What happens:**
1. Browser window opens
2. You log in manually (90 seconds)
3. Script saves cookies to `~/.substack-session.json` and `~/.twitter-session.json`
4. Script validates the sessions

**Session files location:**
- Substack: `/home/ubuntu/.substack-session.json`
- Twitter: `/home/ubuntu/.twitter-session.json`

### Phase 3: Test the Dispatch Webhook (Dry Run)

Test each task without actually posting:

```bash
# Test Base 44 dispatch
node scripts/wukr_dispatch_webhook.mjs --task=base44_dispatch --dry-run

# Test Caribbean 9 AM slot
node scripts/wukr_dispatch_webhook.mjs --task=caribbean_9am --dry-run

# Test Caribbean 1 PM slot
node scripts/wukr_dispatch_webhook.mjs --task=caribbean_1pm --dry-run

# Test Caribbean 6 PM slot
node scripts/wukr_dispatch_webhook.mjs --task=caribbean_6pm --dry-run
```

**Expected output:**
- ✅ Database connection successful
- ✅ Posts fetched from Supabase
- ⚠️  [DRY RUN] Would post to Substack
- ⚠️  [DRY RUN] Would post to Twitter

### Phase 4: Test Live Posting (Optional)

Test one live post to verify everything works:

```bash
# Post one Caribbean article (no dry-run flag)
node scripts/wukr_dispatch_webhook.mjs --task=caribbean_9am
```

**Check:**
1. Article appears on Substack
2. Tweet appears on Twitter with Substack link
3. Database updated with URLs and timestamps

### Phase 5: Set Up cron-job.org Scheduling

#### Get Your API Key

1. Go to https://console.cron-job.org
2. Settings → API → Generate API Key
3. Copy the API key

#### Create Scheduled Jobs

Run the setup script (requires API key):

```bash
python3 /home/ubuntu/skills/daily-content-syndication/scripts/setup_daily_automation.py \
  --api-key <YOUR_CRON_JOB_ORG_API_KEY> \
  --webhook-url <YOUR_WEBHOOK_URL> \
  --secret contancybearsfruit \
  --timezone "America/Puerto_Rico"
```

**Note:** Replace `<YOUR_WEBHOOK_URL>` with your actual webhook endpoint (e.g., exposed via `expose` tool or deployed to Vercel).

#### Manual cron-job.org Configuration

If you prefer to set up jobs manually:

**Job 1: Base 44 Dispatch (7:00 AM AST)**
- URL: `<YOUR_WEBHOOK_URL>`
- Method: POST
- Schedule: Daily at 07:00
- Timezone: America/Puerto_Rico (AST)
- Headers:
  - `Content-Type: application/json`
  - `X-Manus-Signature: contancybearsfruit`
- Body: `{"task": "base44_dispatch"}`

**Job 2: Caribbean 9 AM (9:00 AM AST)**
- URL: `<YOUR_WEBHOOK_URL>`
- Method: POST
- Schedule: Daily at 09:00
- Timezone: America/Puerto_Rico (AST)
- Headers:
  - `Content-Type: application/json`
  - `X-Manus-Signature: contancybearsfruit`
- Body: `{"task": "caribbean_9am"}`

**Job 3: Caribbean 1 PM (1:00 PM AST)**
- URL: `<YOUR_WEBHOOK_URL>`
- Method: POST
- Schedule: Daily at 13:00
- Timezone: America/Puerto_Rico (AST)
- Headers:
  - `Content-Type: application/json`
  - `X-Manus-Signature: contancybearsfruit`
- Body: `{"task": "caribbean_1pm"}`

**Job 4: Caribbean 6 PM (6:00 PM AST)**
- URL: `<YOUR_WEBHOOK_URL>`
- Method: POST
- Schedule: Daily at 18:00
- Timezone: America/Puerto_Rico (AST)
- Headers:
  - `Content-Type: application/json`
  - `X-Manus-Signature: contancybearsfruit`
- Body: `{"task": "caribbean_6pm"}`

## Database Schema

### Tables

#### `processed_content`
Tracks Base 44 content for syndication.

```sql
CREATE TABLE processed_content (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    subtitle VARCHAR(500),
    content TEXT NOT NULL,
    source VARCHAR(100) DEFAULT 'base44',
    substackUrl VARCHAR(500),
    twitterUrl VARCHAR(500),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    publishedAt TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending'
);
```

#### `caribbean_tourism_posts`
Tracks the 6 Caribbean tourism posts and rotation.

```sql
CREATE TABLE caribbean_tourism_posts (
    id SERIAL PRIMARY KEY,
    postNumber INTEGER NOT NULL UNIQUE, -- 1-6
    title VARCHAR(500) NOT NULL,
    subtitle VARCHAR(500),
    content TEXT NOT NULL,
    tags TEXT[],
    targetAudience VARCHAR(200) DEFAULT 'Caribbean tourism businesses',
    lastPostedAt TIMESTAMP,
    postCount INTEGER DEFAULT 0,
    substackUrl VARCHAR(500),
    twitterUrl VARCHAR(500),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `posting_history`
Detailed log of every posting action.

```sql
CREATE TABLE posting_history (
    id SERIAL PRIMARY KEY,
    postId INTEGER REFERENCES caribbean_tourism_posts(id),
    platform VARCHAR(50) NOT NULL,
    postUrl VARCHAR(500),
    status VARCHAR(50) NOT NULL,
    errorMessage TEXT,
    scheduledFor TIMESTAMP,
    postedAt TIMESTAMP,
    engagement JSONB,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Current Status

**Caribbean Tourism Posts:** 6 posts loaded and ready  
**Supabase Project:** `ebrarmerpzlrbsfpmlkg` (ACTIVE_HEALTHY)  
**Database URL:** `https://ebrarmerpzlrbsfpmlkg.supabase.co`

## Rotation Logic

### Caribbean Tourism Posts

The system automatically rotates through 6 posts using this logic:

1. **Fetch posts** ordered by:
   - `lastPostedAt` (NULL first - never posted)
   - `postCount` (ascending - least posted first)
   - `postNumber` (ascending - sequential order)

2. **Post 2 articles** per time slot

3. **Update tracking:**
   - Increment `postCount`
   - Set `lastPostedAt` to current timestamp
   - Store platform URLs

**Result:** Even distribution across all 6 posts, automatic rotation.

### Base 44 Content

The system posts the **latest unposted content**:

1. **Fetch content** where `substackUrl IS NULL`
2. **Order by** `createdAt DESC` (newest first)
3. **Limit 1** (one article per day)
4. **Update** with Substack and Twitter URLs after posting

## Monitoring & Maintenance

### Check Posting History

```bash
# View recent posts
manus-mcp-cli tool call execute_sql --server supabase --input '{
  "project_id": "ebrarmerpzlrbsfpmlkg",
  "query": "SELECT * FROM posting_history ORDER BY postedat DESC LIMIT 20"
}'
```

### Check Caribbean Post Rotation

```bash
# View post counts and last posted times
manus-mcp-cli tool call execute_sql --server supabase --input '{
  "project_id": "ebrarmerpzlrbsfpmlkg",
  "query": "SELECT postnumber, title, postcount, lastpostedat FROM caribbean_tourism_posts ORDER BY postnumber"
}'
```

### Validate Sessions

```bash
# Re-validate platform sessions
node scripts/setup_platform_sessions.mjs --platform=all
```

### Manual Posting

```bash
# Manually trigger any task
node scripts/wukr_dispatch_webhook.mjs --task=caribbean_9am
```

## Troubleshooting

### Issue: "No saved session found"

**Solution:** Run session setup again:
```bash
node scripts/setup_platform_sessions.mjs --platform=all
```

### Issue: "Session appears invalid"

**Cause:** Cookies expired or platform logged you out.

**Solution:** Re-run session setup to refresh cookies.

### Issue: "No posts found in database"

**Cause:** Caribbean tourism posts not initialized.

**Solution:** Run the initialization script:
```bash
node scripts/initialize_caribbean_posts.mjs
```

### Issue: Playwright browser fails to launch

**Solution:** Reinstall Chromium:
```bash
pnpm exec playwright install chromium --force
```

### Issue: cron-job.org returns 502 Bad Gateway

**Cause:** Webhook URL changed (sandbox hibernation/restart).

**Solution:** Update all cron job URLs at https://console.cron-job.org

### Issue: Posts not appearing on platforms

**Check:**
1. Session files exist and are valid
2. Database has posts to publish
3. Dry-run mode is disabled
4. Network connectivity is working

**Debug:**
```bash
# Run with visible browser (no headless)
HEADLESS=false node scripts/wukr_dispatch_webhook.mjs --task=caribbean_9am
```

## File Structure

```
/home/ubuntu/new/
├── scripts/
│   ├── wukr_dispatch_webhook.mjs       # Main dispatch webhook
│   ├── setup_platform_sessions.mjs     # Session setup script
│   ├── initialize_caribbean_posts.mjs  # Load 6 posts into DB
│   ├── schema.sql                      # Database schema
│   └── migration_caribbean_tables.sql  # Migration script
├── content/
│   └── daily_posts_caribbean_tourism.md # 6 Caribbean posts
├── .env.local                          # Environment variables
└── WUKR_WIRE_AUTOMATION_SETUP.md      # This guide
```

## Session Files

```
/home/ubuntu/
├── .substack-session.json              # Substack cookies
└── .twitter-session.json               # Twitter cookies
```

## Next Steps

1. ✅ Install dependencies
2. ✅ Set up platform sessions
3. ✅ Test with dry-run
4. ⏳ Get cron-job.org API key
5. ⏳ Set up cron jobs
6. ⏳ Monitor first automated run

## Support

- **GitHub Repo:** https://github.com/hypnoticproductions/new
- **Supabase Dashboard:** https://supabase.com/dashboard/project/ebrarmerpzlrbsfpmlkg
- **cron-job.org Console:** https://console.cron-job.org

## Automation Summary

**Daily Schedule (AST):**
- 7:00 AM - Base 44 to Substack (1 article)
- 9:00 AM - Caribbean Tourism (2 articles)
- 1:00 PM - Caribbean Tourism (2 articles)
- 6:00 PM - Caribbean Tourism (2 articles)

**Total:** 7 posts per day (1 Base 44 + 6 Caribbean Tourism)

**Platforms:** Substack (primary) + Twitter (with Substack link)

**Duplicate Prevention:** Database tracking with `lastPostedAt` and `postCount`

**Rotation:** Automatic, even distribution across all posts

**Autonomy:** Runs hands-free after initial session setup
