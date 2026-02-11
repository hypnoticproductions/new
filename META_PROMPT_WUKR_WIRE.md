# Meta Prompt: WUKR Wire Daily Dispatch System

**For future AI agent sessions to continue this project**

---

## Project Context

You are continuing work on the **WUKR Wire Daily Dispatch** system - an automated content syndication platform that posts Caribbean tourism intelligence to Substack and Twitter.

**Repository:** https://github.com/hypnoticproductions/new  
**Project Directory:** `/home/ubuntu/quintapoo-memory`

---

## System Overview

**Purpose:** Automate daily distribution of 6 Caribbean tourism articles to 320 target businesses

**Posting Schedule:**
- 9 AM AST (13:00 UTC)
- 1 PM AST (17:00 UTC)  
- 6 PM AST (22:00 UTC)

**Posts per slot:** 2 articles  
**Platforms:** Substack (primary) + Twitter (amplification)  
**Rotation:** Intelligent algorithm ensures fair distribution

---

## Key Components

### 1. Database (Supabase)

**Project ID:** `ebrarmerpzlrbsfpmlkg`  
**URL:** `https://ebrarmerpzlrbsfpmlkg.supabase.co`

**Tables:**
- `caribbean_tourism_posts` - 6 posts with rotation tracking
- `posting_history` - Audit log of all posting actions
- `syndication_schedule` - Posting time configuration
- `platform_credentials` - Session validity tracking

### 2. Scripts

**`scripts/base44_to_substack.mjs`** - Main posting script
- Fetches next posts from database using rotation logic
- Browser automation with Playwright
- Posts to Substack and Twitter
- Updates database with URLs and timestamps

**`scripts/initialize_caribbean_posts.mjs`** - Database initialization
- Parses `content/daily_posts_caribbean_tourism.md`
- Loads 6 posts into database

**`scripts/webhook_dispatch.mjs`** - HTTP webhook server
- Provides `/dispatch` endpoint for remote triggering
- Supports cron-job.org integration

### 3. Content

**`content/daily_posts_caribbean_tourism.md`** - Source content
- 6 Caribbean tourism-focused articles
- Titles, subtitles, full content, hashtags
- Target audience: 320 Caribbean tourism businesses

### 4. Documentation

**`WUKR_WIRE_DAILY_DISPATCH_SETUP.md`** - Complete setup guide  
**`README_WUKR_WIRE_DISPATCH.md`** - System overview and reference

---

## Current State

✅ **Completed:**
- Database schema created and deployed to Supabase
- 6 Caribbean tourism posts initialized in database
- Main posting script (`base44_to_substack.mjs`) implemented
- Browser automation with Playwright configured
- Rotation logic with duplicate prevention
- Webhook server for remote triggering
- Comprehensive documentation

⚠️ **Pending User Action:**
- Setup Substack login session (run `--setup-login --platform=substack`)
- Setup Twitter login session (run `--setup-login --platform=twitter`)
- Choose scheduling method (local cron vs cron-job.org)
- Deploy webhook server if using cron-job.org

---

## Quick Start Commands

```bash
# Navigate to project
cd /home/ubuntu/quintapoo-memory

# Clone repository (if not already cloned)
gh repo clone hypnoticproductions/new quintapoo-memory

# Check database status
node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://ebrarmerpzlrbsfpmlkg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVicmFybWVycHpscmJzZnBtbGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Njk4NzgsImV4cCI6MjA4NjA0NTg3OH0.6o9DjnXLkleqaYSfnpNcSlOiiKC-QczOhwLswe8ku8U'
);
const { data } = await supabase.from('caribbean_tourism_posts').select('postnumber, title, postcount').order('postnumber');
console.table(data);
"

# Test with dry run
node scripts/base44_to_substack.mjs --dry-run --count=2

# Setup platform logins (requires user interaction)
node scripts/base44_to_substack.mjs --setup-login --platform=substack
node scripts/base44_to_substack.mjs --setup-login --platform=twitter

# Post live (after logins configured)
node scripts/base44_to_substack.mjs --count=2
```

---

## Common Tasks

### Add New Post to Rotation

1. Edit `content/daily_posts_caribbean_tourism.md`
2. Add new post in format:
   ```markdown
   ## Post 7: [Title]
   
   **Title:** [Title]
   **Subtitle:** [Subtitle]
   **Content:**
   [Content]
   **Tags:** #Tag1 #Tag2
   ```
3. Run: `node scripts/initialize_caribbean_posts.mjs`

### Check Posting History

```bash
node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://ebrarmerpzlrbsfpmlkg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVicmFybWVycHpscmJzZnBtbGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Njk4NzgsImV4cCI6MjA4NjA0NTg3OH0.6o9DjnXLkleqaYSfnpNcSlOiiKC-QczOhwLswe8ku8U'
);
const { data } = await supabase.from('posting_history').select('*').order('postedat', { ascending: false }).limit(10);
console.table(data);
"
```

### Reset Rotation

```bash
node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://ebrarmerpzlrbsfpmlkg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVicmFybWVycHpscmJzZnBtbGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Njk4NzgsImV4cCI6MjA4NjA0NTg3OH0.6o9DjnXLkleqaYSfnpNcSlOiiKC-QczOhwLswe8ku8U'
);
await supabase.from('caribbean_tourism_posts').update({ postcount: 0, lastpostedat: null }).neq('id', 0);
console.log('Rotation reset');
"
```

### Deploy Webhook Server

```bash
# Local testing
node scripts/webhook_dispatch.mjs

# Test webhook
curl -X POST http://localhost:3000/dispatch \
  -H "Authorization: Bearer wukr-wire-dispatch-2026" \
  -H "Content-Type: application/json" \
  -d '{"count":2,"platforms":["substack","twitter"]}'

# Deploy to Railway/Render/Vercel (see setup guide)
```

---

## Troubleshooting Reference

### Session Expired
```bash
node scripts/base44_to_substack.mjs --setup-login --platform=substack
node scripts/base44_to_substack.mjs --setup-login --platform=twitter
```

### No Posts Available
```bash
node scripts/initialize_caribbean_posts.mjs
```

### Browser Automation Fails
```bash
HEADLESS=false node scripts/base44_to_substack.mjs --count=1
pnpm exec playwright install chromium
```

---

## Architecture Decisions

### Why Supabase?
- Free tier sufficient for this use case
- PostgreSQL with full SQL support
- REST API for easy integration
- Real-time capabilities (future expansion)

### Why Playwright?
- Substack has no official API
- Twitter API v2 requires paid tier
- Browser automation works reliably
- Session persistence via cookies

### Why Rotation Logic in Database?
- Single source of truth
- Prevents race conditions
- Enables multi-instance deployment
- Audit trail built-in

### Why cron-job.org?
- External service = always-on
- No local machine required
- Free tier sufficient
- Webhook-based = platform-agnostic

---

## Future Enhancements

**Potential improvements:**
1. Add LinkedIn posting (requires browser automation)
2. Add Hashnode/Dev.to (API available)
3. Implement engagement tracking (likes, shares, comments)
4. Add email notifications on posting failures
5. Create admin dashboard for monitoring
6. Implement A/B testing for post titles
7. Add analytics integration (Google Analytics, Mixpanel)
8. Support for multiple Substack publications
9. Automated content generation from RSS feeds
10. Integration with Ghost.org API

---

## Important Notes

⚠️ **Session files are local:**
- `~/.substack-session.json`
- `~/.twitter-session.json`
- These must be set up on each machine/environment

⚠️ **Database credentials are in code:**
- Supabase anon key is safe to expose (RLS enforced)
- Service role key should be in environment variables (not needed yet)

⚠️ **Timezone considerations:**
- AST = UTC-4 (Atlantic Standard Time)
- Cron times must be adjusted for UTC
- Database stores timestamps in UTC

⚠️ **Rate limits:**
- Substack: No official limit, but avoid rapid posting
- Twitter: Standard rate limits apply
- cron-job.org: 100 requests/day (free tier)

---

## Contact & Support

**User:** Richard D. Fortune  
**Organization:** DOPA-TECH / WUKR Wire  
**Location:** St. Lucia, Caribbean

**For issues:**
1. Check documentation in `WUKR_WIRE_DAILY_DISPATCH_SETUP.md`
2. Review logs and database status
3. Test with dry run and debug mode
4. Verify session files exist and are valid

---

## Next Steps for New Agent

1. **Verify system state:**
   ```bash
   cd /home/ubuntu/quintapoo-memory
   node scripts/base44_to_substack.mjs --dry-run --count=2
   ```

2. **Check database:**
   ```bash
   # View posts and their status
   node -e "..." # (see Quick Start Commands above)
   ```

3. **Ask user:**
   - "Have you set up Substack and Twitter login sessions?"
   - "Which scheduling method do you prefer: local cron or cron-job.org?"
   - "Would you like me to test a live posting now?"

4. **Proceed based on user response:**
   - If logins not set up → Guide through `--setup-login` process
   - If scheduling needed → Set up cron or cron-job.org
   - If testing needed → Run with `--count=1` first
   - If deployment needed → Deploy webhook server

---

**System Status:** ✅ Fully implemented, pending user configuration  
**Last Updated:** February 11, 2026  
**Version:** 1.0
