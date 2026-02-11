# WUKR Wire Daily Dispatch - Complete Setup Guide

**Automated Caribbean Tourism Content Syndication**

Target: 320 Caribbean tourism businesses  
Platforms: Substack + Twitter  
Schedule: 9 AM, 1 PM, 6 PM AST (3 times daily)  
Posts: 2 articles per time slot, rotating through 6 posts

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Database Setup](#database-setup)
4. [Content Initialization](#content-initialization)
5. [Platform Login Setup](#platform-login-setup)
6. [Scheduling Options](#scheduling-options)
7. [Testing](#testing)
8. [Monitoring](#monitoring)
9. [Troubleshooting](#troubleshooting)

---

## Quick Start

**For immediate testing (no scheduling):**

```bash
cd /home/ubuntu/quintapoo-memory

# 1. Initialize database with 6 Caribbean tourism posts
node scripts/initialize_caribbean_posts.mjs

# 2. Setup Substack login (opens browser, wait 60s to log in)
node scripts/base44_to_substack.mjs --setup-login --platform=substack

# 3. Setup Twitter login (opens browser, wait 60s to log in)
node scripts/base44_to_substack.mjs --setup-login --platform=twitter

# 4. Test with dry run
node scripts/base44_to_substack.mjs --dry-run --count=2

# 5. Post 2 articles NOW
node scripts/base44_to_substack.mjs --count=2
```

---

## Prerequisites

### 1. Node.js Dependencies

Already installed in the project:
- `playwright` - Browser automation
- `@supabase/supabase-js` - Database client

### 2. Supabase Database

**Project ID:** `ebrarmerpzlrbsfpmlkg`  
**URL:** `https://ebrarmerpzlrbsfpmlkg.supabase.co`  
**Status:** ✅ Active and configured

Tables created:
- `caribbean_tourism_posts` - Stores the 6 posts
- `posting_history` - Logs all posting actions
- `syndication_schedule` - Manages posting times
- `platform_credentials` - Tracks session validity

### 3. Platform Accounts

You need active accounts on:
- **Substack:** https://richarddannibarrifortune.substack.com
- **Twitter/X:** Your Twitter account

---

## Database Setup

The database is already configured with the schema. To verify:

```bash
# Check if tables exist
node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://ebrarmerpzlrbsfpmlkg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVicmFybWVycHpscmJzZnBtbGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Njk4NzgsImV4cCI6MjA4NjA0NTg3OH0.6o9DjnXLkleqaYSfnpNcSlOiiKC-QczOhwLswe8ku8U'
);
const { data } = await supabase.from('caribbean_tourism_posts').select('count');
console.log('Posts in database:', data);
"
```

---

## Content Initialization

Load the 6 Caribbean tourism posts into the database:

```bash
cd /home/ubuntu/quintapoo-memory
node scripts/initialize_caribbean_posts.mjs
```

**Expected output:**
```
✅ Successfully initialized 6 posts
Post 1: Caribbean Tourism Shows Strong Recovery in Q1 2026
Post 2: Hurricane Season 2026: Essential Crisis Communication Strategies
Post 3: Social Media ROI: Which Platforms Drive Caribbean Tourism Bookings?
Post 4: Why Eco-Certification Increases Caribbean Tourism Revenue by 31%
Post 5: Solving the Caribbean Tourism Labor Shortage: Strategies That Work
Post 6: 2026 Tourism Technology: Essential Tools for Caribbean Operators
```

**To reinitialize (clears existing data):**
```bash
node scripts/initialize_caribbean_posts.mjs
```

---

## Platform Login Setup

The system uses saved browser sessions to avoid repeated logins.

### Substack Login

```bash
cd /home/ubuntu/quintapoo-memory
node scripts/base44_to_substack.mjs --setup-login --platform=substack
```

1. Browser window opens
2. Navigate to Substack and log in
3. Wait 60 seconds (script automatically saves cookies)
4. Session saved to `~/.substack-session.json`

### Twitter Login

```bash
node scripts/base44_to_substack.mjs --setup-login --platform=twitter
```

1. Browser window opens to Twitter
2. Log in to your account
3. Wait 60 seconds (script automatically saves cookies)
4. Session saved to `~/.twitter-session.json`

**Session files location:**
- `~/.substack-session.json`
- `~/.twitter-session.json`

**Sessions expire after ~30 days. Re-run setup if you see login errors.**

---

## Scheduling Options

You have **3 options** for automated scheduling:

### Option A: Local Cron (Simplest)

**Best for:** Personal machine that's always on

**Setup:**

```bash
# Edit crontab
crontab -e

# Add these lines (AST = UTC-4):
# 9 AM AST = 13:00 UTC
0 13 * * * cd /home/ubuntu/quintapoo-memory && node scripts/base44_to_substack.mjs --count=2 >> /var/log/wukr-dispatch.log 2>&1

# 1 PM AST = 17:00 UTC
0 17 * * * cd /home/ubuntu/quintapoo-memory && node scripts/base44_to_substack.mjs --count=2 >> /var/log/wukr-dispatch.log 2>&1

# 6 PM AST = 22:00 UTC
0 22 * * * cd /home/ubuntu/quintapoo-memory && node scripts/base44_to_substack.mjs --count=2 >> /var/log/wukr-dispatch.log 2>&1
```

**View logs:**
```bash
tail -f /var/log/wukr-dispatch.log
```

---

### Option B: cron-job.org (Most Reliable)

**Best for:** Cloud-based scheduling, no local machine required

**Prerequisites:**
1. Create account at https://console.cron-job.org
2. Generate API key (Settings → API)
3. Deploy webhook endpoint (see Option C)

**Setup with API:**

```bash
# Set your API key
export CRONJOB_API_KEY="your_api_key_here"

# Create 9 AM AST job
curl -X PUT \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $CRONJOB_API_KEY" \
  -d '{
    "job": {
      "url": "https://your-webhook-url.com/dispatch",
      "enabled": true,
      "title": "WUKR Wire - 9 AM AST",
      "saveResponses": true,
      "requestMethod": 1,
      "requestTimeout": 300,
      "schedule": {
        "timezone": "America/Puerto_Rico",
        "hours": [9],
        "mdays": [-1],
        "minutes": [0],
        "months": [-1],
        "wdays": [-1]
      },
      "extendedData": {
        "headers": {
          "Content-Type": "application/json",
          "Authorization": "Bearer wukr-wire-dispatch-2026"
        },
        "body": "{\"count\":2,\"platforms\":[\"substack\",\"twitter\"]}"
      }
    }
  }' \
  https://api.cron-job.org/jobs

# Create 1 PM AST job (change hours to [13])
# Create 6 PM AST job (change hours to [18])
```

**Manual setup (no API):**
1. Go to https://console.cron-job.org
2. Click "Create cronjob"
3. Enter webhook URL
4. Set schedule: `0 9 * * *` (9 AM daily)
5. Add header: `Authorization: Bearer wukr-wire-dispatch-2026`
6. Add body: `{"count":2,"platforms":["substack","twitter"]}`
7. Repeat for 1 PM and 6 PM

---

### Option C: Webhook Server (For cron-job.org)

**Deploy the webhook server to trigger posting:**

```bash
cd /home/ubuntu/quintapoo-memory

# Start webhook server
node scripts/webhook_dispatch.mjs
```

**Server runs on port 3000 by default.**

**Endpoints:**
- `GET /health` - Health check
- `GET /status` - View posting status and history
- `POST /dispatch` - Trigger posting (requires API key)

**Environment variables:**
```bash
export PORT=3000
export WEBHOOK_API_KEY="wukr-wire-dispatch-2026"
```

**Test the webhook:**
```bash
curl -X POST http://localhost:3000/dispatch \
  -H "Authorization: Bearer wukr-wire-dispatch-2026" \
  -H "Content-Type: application/json" \
  -d '{"count":2,"platforms":["substack","twitter"]}'
```

**Deploy to cloud:**

**Railway:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

**Vercel (requires adaptation to serverless):**
```bash
vercel deploy
```

**Render.com:**
1. Connect GitHub repo
2. Set start command: `node scripts/webhook_dispatch.mjs`
3. Add environment variables

---

## Testing

### Dry Run (No actual posting)

```bash
cd /home/ubuntu/quintapoo-memory

# See what would be posted
node scripts/base44_to_substack.mjs --dry-run --count=2
```

### Post to Substack Only

```bash
node scripts/base44_to_substack.mjs --count=2 --platform=substack
```

### Post to Twitter Only

```bash
node scripts/base44_to_substack.mjs --count=2 --platform=twitter
```

### Post to Both Platforms

```bash
node scripts/base44_to_substack.mjs --count=2
```

### Debug Mode (Show Browser)

```bash
HEADLESS=false node scripts/base44_to_substack.mjs --count=1
```

---

## Monitoring

### Check Database Status

```bash
# View all posts and their status
node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://ebrarmerpzlrbsfpmlkg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVicmFybWVycHpscmJzZnBtbGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Njk4NzgsImV4cCI6MjA4NjA0NTg3OH0.6o9DjnXLkleqaYSfnpNcSlOiiKC-QczOhwLswe8ku8U'
);
const { data } = await supabase
  .from('caribbean_tourism_posts')
  .select('postnumber, title, postcount, lastpostedat, substackurl, twitterurl')
  .order('postnumber');
console.table(data);
"
```

### View Recent Posting History

```bash
node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://ebrarmerpzlrbsfpmlkg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVicmFybWVycHpscmJzZnBtbGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Njk4NzgsImV4cCI6MjA4NjA0NTg3OH0.6o9DjnXLkleqaYSfnpNcSlOiiKC-QczOhwLswe8ku8U'
);
const { data } = await supabase
  .from('posting_history')
  .select('*')
  .order('postedat', { ascending: false })
  .limit(20);
console.table(data);
"
```

### Webhook Server Status

```bash
curl http://localhost:3000/status | jq
```

---

## Troubleshooting

### Session Expired Errors

**Symptom:** "No saved session found" or login errors

**Fix:**
```bash
# Re-run setup for the failing platform
node scripts/base44_to_substack.mjs --setup-login --platform=substack
node scripts/base44_to_substack.mjs --setup-login --platform=twitter
```

### No Posts Available

**Symptom:** "No posts available to publish"

**Fix:**
```bash
# Reinitialize posts
node scripts/initialize_caribbean_posts.mjs
```

### Database Connection Errors

**Symptom:** "Could not connect to database"

**Check:**
1. Supabase project is active
2. API key is correct
3. Network connection is working

### Browser Automation Fails

**Symptom:** Playwright errors or timeouts

**Fix:**
```bash
# Run in visible mode to see what's happening
HEADLESS=false node scripts/base44_to_substack.mjs --count=1

# Reinstall Playwright browsers
pnpm exec playwright install chromium
```

### Rotation Not Working

**Symptom:** Same posts keep getting published

**Check:**
```bash
# View post counts
node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://ebrarmerpzlrbsfpmlkg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVicmFybWVycHpscmJzZnBtbGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Njk4NzgsImV4cCI6MjA4NjA0NTg3OH0.6o9DjnXLkleqaYSfnpNcSlOiiKC-QczOhwLswe8ku8U'
);
const { data } = await supabase
  .from('caribbean_tourism_posts')
  .select('postnumber, postcount, lastpostedat')
  .order('postnumber');
console.table(data);
"
```

**Reset rotation:**
```bash
# Reset all post counts to 0
node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://ebrarmerpzlrbsfpmlkg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVicmFybWVycHpscmJzZnBtbGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Njk4NzgsImV4cCI6MjA4NjA0NTg3OH0.6o9DjnXLkleqaYSfnpNcSlOiiKC-QczOhwLswe8ku8U'
);
await supabase
  .from('caribbean_tourism_posts')
  .update({ postcount: 0, lastpostedat: null })
  .neq('id', 0);
console.log('Reset complete');
"
```

---

## File Structure

```
/home/ubuntu/quintapoo-memory/
├── scripts/
│   ├── base44_to_substack.mjs          # Main posting script
│   ├── initialize_caribbean_posts.mjs  # Database initialization
│   ├── webhook_dispatch.mjs            # Webhook server
│   └── schema.sql                      # Database schema
├── content/
│   └── daily_posts_caribbean_tourism.md # 6 Caribbean tourism posts
└── WUKR_WIRE_DAILY_DISPATCH_SETUP.md   # This file
```

**Session files (in home directory):**
- `~/.substack-session.json`
- `~/.twitter-session.json`

---

## Command Reference

| Command | Description |
|---------|-------------|
| `node scripts/initialize_caribbean_posts.mjs` | Initialize database with 6 posts |
| `node scripts/base44_to_substack.mjs --setup-login --platform=substack` | Setup Substack login |
| `node scripts/base44_to_substack.mjs --setup-login --platform=twitter` | Setup Twitter login |
| `node scripts/base44_to_substack.mjs --dry-run --count=2` | Test without posting |
| `node scripts/base44_to_substack.mjs --count=2` | Post 2 articles |
| `node scripts/base44_to_substack.mjs --count=2 --platform=substack` | Post to Substack only |
| `node scripts/base44_to_substack.mjs --count=2 --platform=twitter` | Post to Twitter only |
| `HEADLESS=false node scripts/base44_to_substack.mjs --count=1` | Debug mode (show browser) |
| `node scripts/webhook_dispatch.mjs` | Start webhook server |

---

## Success Criteria

✅ **System is working correctly when:**

1. Database has 6 posts initialized
2. Substack and Twitter sessions are saved
3. Dry run shows correct posts
4. Live posting succeeds on both platforms
5. Database updates with URLs and timestamps
6. Rotation logic cycles through all 6 posts
7. Scheduled jobs trigger at correct times

---

## Support

**For issues:**
1. Check this troubleshooting guide
2. Review logs: `tail -f /var/log/wukr-dispatch.log`
3. Run in debug mode: `HEADLESS=false node scripts/base44_to_substack.mjs --count=1`
4. Check database status with monitoring commands

**System designed by:** WUKR Wire Intelligence  
**Target audience:** 320 Caribbean tourism businesses  
**Posting frequency:** 3 times daily (9 AM, 1 PM, 6 PM AST)  
**Content rotation:** 6 posts, fair rotation algorithm

---

**WUKR Wire Daily Dispatch** - Automated Caribbean Tourism Content Syndication
