# WUKR Wire Daily Dispatch System

**Automated Caribbean Tourism Content Syndication to Substack & Twitter**

---

## 🎯 Overview

This system automates the daily distribution of Caribbean tourism intelligence to 320 target businesses across Substack and Twitter. It posts **6 unique articles** in rotation, **3 times per day** (9 AM, 1 PM, 6 PM AST), with **2 articles per time slot**.

### Key Features

✅ **Intelligent Rotation** - Fair distribution algorithm ensures all 6 posts get equal exposure  
✅ **Duplicate Prevention** - Supabase database tracks posting history  
✅ **Multi-Platform** - Simultaneous posting to Substack (long-form) and Twitter (summary + link)  
✅ **Browser Automation** - Playwright handles login sessions and posting  
✅ **Flexible Scheduling** - Local cron, cron-job.org, or webhook-triggered execution  
✅ **Comprehensive Logging** - Full audit trail in database and console logs

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    WUKR Wire Daily Dispatch                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │         Scheduling Trigger              │
        │  • Local Cron (Option A)                │
        │  • cron-job.org (Option B)              │
        │  • Manual execution                     │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │    base44_to_substack.mjs               │
        │  • Fetches next 2 posts from DB         │
        │  • Rotation logic (never posted first)  │
        │  • Browser automation (Playwright)      │
        └─────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
    ┌───────────────────┐       ┌───────────────────┐
    │   Substack Post   │       │   Twitter Post    │
    │  • Full article   │       │  • Summary + link │
    │  • Title/subtitle │       │  • Hashtags       │
    │  • Complete body  │       │  • 280 char max   │
    └───────────────────┘       └───────────────────┘
                │                           │
                └─────────────┬─────────────┘
                              ▼
        ┌─────────────────────────────────────────┐
        │        Supabase Database                │
        │  • Update post count                    │
        │  • Record lastpostedat timestamp        │
        │  • Log to posting_history               │
        │  • Store published URLs                 │
        └─────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Initialize Database

```bash
cd /home/ubuntu/quintapoo-memory
node scripts/initialize_caribbean_posts.mjs
```

### 2. Setup Platform Logins

```bash
# Substack (browser opens, log in, wait 60s)
node scripts/base44_to_substack.mjs --setup-login --platform=substack

# Twitter (browser opens, log in, wait 60s)
node scripts/base44_to_substack.mjs --setup-login --platform=twitter
```

### 3. Test with Dry Run

```bash
node scripts/base44_to_substack.mjs --dry-run --count=2
```

### 4. Post Live

```bash
node scripts/base44_to_substack.mjs --count=2
```

---

## 📁 File Structure

```
quintapoo-memory/
├── scripts/
│   ├── base44_to_substack.mjs          # Main posting script
│   ├── initialize_caribbean_posts.mjs  # Database initialization
│   ├── webhook_dispatch.mjs            # Webhook server (optional)
│   ├── schema.sql                      # Database schema
│   └── posting_history.json            # Legacy tracking (V7)
├── content/
│   └── daily_posts_caribbean_tourism.md # 6 Caribbean tourism posts
├── WUKR_WIRE_DAILY_DISPATCH_SETUP.md   # Complete setup guide
├── README_WUKR_WIRE_DISPATCH.md        # This file
└── .env.local.example                  # Environment template
```

**Session files (in home directory):**
- `~/.substack-session.json` - Saved Substack cookies
- `~/.twitter-session.json` - Saved Twitter cookies

---

## 🗄️ Database Schema

### Tables

**`caribbean_tourism_posts`** - Stores the 6 posts
- `id` - Primary key
- `postnumber` - Post number (1-6)
- `title` - Post title
- `subtitle` - Post subtitle
- `content` - Full post content
- `tags` - Array of hashtags
- `targetaudience` - Target audience description
- `lastpostedat` - Last posting timestamp
- `postcount` - Total times posted
- `substackurl` - Latest Substack URL
- `twitterurl` - Latest Twitter URL
- `createdat`, `updatedat` - Timestamps

**`posting_history`** - Audit log of all posting actions
- `id` - Primary key
- `postid` - Foreign key to caribbean_tourism_posts
- `platform` - Platform name (substack, twitter)
- `posturl` - Published URL
- `status` - Status (success, failed)
- `errormessage` - Error details (if failed)
- `postedat` - Posting timestamp

**`syndication_schedule`** - Posting schedule configuration
- `scheduledtime` - Time of day (09:00:00, 13:00:00, 18:00:00)
- `timezone` - Timezone (America/Puerto_Rico = AST)
- `postsperslot` - Posts per execution (default: 2)
- `enabled` - Schedule enabled flag

**`platform_credentials`** - Session validity tracking
- `platform` - Platform name
- `sessionvalid` - Session validity flag
- `lastvalidated` - Last validation timestamp

---

## 🔄 Rotation Logic

The system uses a **fair rotation algorithm**:

1. **Never posted** - Posts with `lastpostedat = NULL` get highest priority
2. **Least posted** - Posts with lowest `postcount` come next
3. **Oldest posted** - Posts with oldest `lastpostedat` come next
4. **Sequential order** - Tie-breaker uses `postnumber` (1-6)

This ensures:
- All 6 posts get published before any repeat
- Even distribution over time
- No post gets "stuck" or over-represented

---

## 📅 Scheduling Options

### Option A: Local Cron

**Best for:** Personal machine that's always on

```bash
crontab -e

# Add these lines (AST = UTC-4):
0 13 * * * cd /home/ubuntu/quintapoo-memory && node scripts/base44_to_substack.mjs --count=2 >> /var/log/wukr-dispatch.log 2>&1
0 17 * * * cd /home/ubuntu/quintapoo-memory && node scripts/base44_to_substack.mjs --count=2 >> /var/log/wukr-dispatch.log 2>&1
0 22 * * * cd /home/ubuntu/quintapoo-memory && node scripts/base44_to_substack.mjs --count=2 >> /var/log/wukr-dispatch.log 2>&1
```

### Option B: cron-job.org

**Best for:** Cloud-based, always-on scheduling

1. Create account at https://console.cron-job.org
2. Generate API key (Settings → API)
3. Deploy webhook endpoint (see `webhook_dispatch.mjs`)
4. Create 3 cron jobs (9 AM, 1 PM, 6 PM AST)

See `WUKR_WIRE_DAILY_DISPATCH_SETUP.md` for detailed instructions.

---

## 🧪 Testing Commands

```bash
# Dry run (no actual posting)
node scripts/base44_to_substack.mjs --dry-run --count=2

# Post to Substack only
node scripts/base44_to_substack.mjs --count=2 --platform=substack

# Post to Twitter only
node scripts/base44_to_substack.mjs --count=2 --platform=twitter

# Post to both platforms
node scripts/base44_to_substack.mjs --count=2

# Debug mode (show browser)
HEADLESS=false node scripts/base44_to_substack.mjs --count=1

# Post specific number of articles
node scripts/base44_to_substack.mjs --count=3
```

---

## 📊 Monitoring

### Check Post Status

```bash
node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://ebrarmerpzlrbsfpmlkg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVicmFybWVycHpscmJzZnBtbGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Njk4NzgsImV4cCI6MjA4NjA0NTg3OH0.6o9DjnXLkleqaYSfnpNcSlOiiKC-QczOhwLswe8ku8U'
);
const { data } = await supabase
  .from('caribbean_tourism_posts')
  .select('postnumber, title, postcount, lastpostedat')
  .order('postnumber');
console.table(data);
"
```

### View Recent History

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
  .limit(10);
console.table(data);
"
```

---

## 🛠️ Troubleshooting

### Session Expired

**Symptom:** "No saved session found" or login errors

**Fix:**
```bash
node scripts/base44_to_substack.mjs --setup-login --platform=substack
node scripts/base44_to_substack.mjs --setup-login --platform=twitter
```

### No Posts Available

**Symptom:** "No posts available to publish"

**Fix:**
```bash
node scripts/initialize_caribbean_posts.mjs
```

### Browser Automation Fails

**Symptom:** Playwright errors or timeouts

**Fix:**
```bash
# Run in visible mode to debug
HEADLESS=false node scripts/base44_to_substack.mjs --count=1

# Reinstall browsers
pnpm exec playwright install chromium
```

### Reset Rotation

```bash
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
console.log('Rotation reset complete');
"
```

---

## 📝 The 6 Caribbean Tourism Posts

1. **Caribbean Tourism Shows Strong Recovery in Q1 2026**  
   Regional arrivals up 23%, led by digital nomad programs

2. **Hurricane Season 2026: Essential Crisis Communication Strategies**  
   Protect reputation and maintain bookings during weather disruptions

3. **Social Media ROI: Which Platforms Drive Caribbean Tourism Bookings?**  
   Data-driven insights on Instagram, TikTok, and Facebook

4. **Why Eco-Certification Increases Caribbean Tourism Revenue by 31%**  
   Business case for sustainable tourism practices

5. **Solving the Caribbean Tourism Labor Shortage: Strategies That Work**  
   Attract, train, and retain hospitality talent

6. **2026 Tourism Technology: Essential Tools for Caribbean Operators**  
   AI chatbots to contactless check-in, tech investments that deliver ROI

---

## 🎯 Target Audience

**320 Caribbean tourism businesses:**
- Hotels and resorts
- Tour operators
- Restaurants and beach clubs
- Travel agencies
- Destination marketing organizations
- Tourism boards
- Hospitality service providers

---

## 📈 Success Metrics

- **Posting frequency:** 3 times daily (9 AM, 1 PM, 6 PM AST)
- **Articles per slot:** 2 posts
- **Total daily posts:** 6 articles
- **Rotation cycle:** Complete cycle every 3 days (6 posts ÷ 2 per slot)
- **Platforms:** Substack (primary) + Twitter (amplification)
- **Duplicate prevention:** 100% (database-tracked)

---

## 🔗 Related Documentation

- **[WUKR_WIRE_DAILY_DISPATCH_SETUP.md](./WUKR_WIRE_DAILY_DISPATCH_SETUP.md)** - Complete setup guide with step-by-step instructions
- **[content/daily_posts_caribbean_tourism.md](./content/daily_posts_caribbean_tourism.md)** - Source content for the 6 posts
- **[scripts/schema.sql](./scripts/schema.sql)** - Database schema with rotation functions

---

## 🚀 Deployment Checklist

- [ ] Database initialized with 6 posts
- [ ] Substack session saved (`~/.substack-session.json`)
- [ ] Twitter session saved (`~/.twitter-session.json`)
- [ ] Dry run successful
- [ ] Live posting tested
- [ ] Scheduling configured (cron or cron-job.org)
- [ ] Monitoring commands tested
- [ ] Logs accessible

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review logs: `tail -f /var/log/wukr-dispatch.log`
3. Run in debug mode: `HEADLESS=false node scripts/base44_to_substack.mjs --count=1`
4. Verify database status with monitoring commands

---

**WUKR Wire Daily Dispatch** - Automated Caribbean Tourism Content Syndication  
**System Version:** 1.0  
**Last Updated:** February 11, 2026  
**Designed for:** 320 Caribbean tourism businesses
