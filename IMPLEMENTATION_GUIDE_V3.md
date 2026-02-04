# Caribbean Tourism Content Syndication - Implementation Guide V3

## 🎯 Overview

**Automated Caribbean tourism content syndication system** that posts 2 articles to Substack and Twitter at scheduled times throughout the day, targeting **320 Caribbean tourism businesses**.

### Posting Schedule

| Time Slot | AST | UTC | Posts |
|-----------|-----|-----|-------|
| Morning | 9:00 AM | 13:00 | Posts 1-2 |
| Afternoon | 1:00 PM | 17:00 | Posts 3-4 |
| Evening | 6:00 PM | 22:00 | Posts 5-6 |

**Total**: 6 posts per day (2 posts × 3 time slots)

---

## ✅ What's Been Completed

### 1. Enhanced Posting Script (V3)

**Location**: `/home/ubuntu/quintapoo-memory/scripts/post_caribbean_tourism_v3.mjs`

**Key Features**:
- ✅ Separate session management for Substack and Twitter
- ✅ Improved URL capture for both platforms
- ✅ Enhanced error handling (continues if one platform fails)
- ✅ Date/time validation for content freshness
- ✅ Autonomous operation with saved session cookies
- ✅ Setup login mode for easy authentication
- ✅ Dry-run mode for testing

**Improvements over V2**:
- Twitter session cookies now saved separately at `~/.twitter-session.json`
- Better error recovery - posts to Twitter even if Substack fails
- Improved URL extraction from both platforms
- More robust selector fallbacks
- Enhanced logging and status reporting

### 2. Content Library

**Location**: `/home/ubuntu/quintapoo-memory/content/daily_posts_caribbean_tourism.md`

**6 Pre-Written Articles**:
1. Caribbean Tourism Recovery Trends
2. Crisis Management for Caribbean Tourism Operators
3. Digital Marketing Strategies for Caribbean Tourism
4. Why Eco-Certification Increases Caribbean Tourism Revenue by 31%
5. Solving the Caribbean Tourism Labor Shortage
6. 2026 Tourism Technology: Essential Tools for Caribbean Operators

### 3. Rotation Database

**Location**: `/home/ubuntu/quintapoo-memory/scripts/posting_history.json`

**Tracks**:
- Post count for each article
- Last posted timestamp
- Published URLs (Substack & Twitter)
- Complete posting history with success/failure status

**Rotation Algorithm**:
1. Never posted (highest priority)
2. Lowest post count
3. Oldest `lastPostedAt` timestamp
4. Post number (tiebreaker)

### 4. Automated Scheduling

**Configured via Manus Schedule Tool**:
- Cron expression: `0 0 13,17,22 * * *`
- Executes 3 times daily at scheduled times
- Automatic retry and error handling
- Complete playbook for execution context

### 5. Session Management

**Session Files**:
- Substack: `/home/ubuntu/.substack-session.json`
- Twitter: `/home/ubuntu/.twitter-session.json`

**Status**: ⚠️ **Requires Initial Setup** (see below)

---

## 🔧 Initial Setup Required

### Step 1: Install Dependencies (✅ Complete)

```bash
cd /home/ubuntu/quintapoo-memory
pnpm install
npx playwright install chromium
```

### Step 2: Login to Platforms (⚠️ Required)

You need to log in once to save session cookies. Run:

```bash
cd /home/ubuntu/quintapoo-memory
HEADLESS=false node scripts/post_caribbean_tourism_v3.mjs --setup-login
```

**What happens**:
1. Browser opens for Substack
2. You log in manually (60 seconds)
3. Session saved to `~/.substack-session.json`
4. Browser opens for Twitter
5. You log in manually (60 seconds)
6. Session saved to `~/.twitter-session.json`

**Alternative**: If you prefer to handle login separately, you can manually log in to both platforms in your browser, then export the cookies to the session files.

### Step 3: Test the System

```bash
# Dry run (no actual posting)
cd /home/ubuntu/quintapoo-memory
node scripts/post_caribbean_tourism_v3.mjs --dry-run

# Real posting (after login)
node scripts/post_caribbean_tourism_v3.mjs
```

---

## 📊 Usage & Monitoring

### Manual Posting

```bash
# Post 2 articles now
cd /home/ubuntu/quintapoo-memory
node scripts/post_caribbean_tourism_v3.mjs

# Test without posting
node scripts/post_caribbean_tourism_v3.mjs --dry-run

# Show browser (for debugging)
HEADLESS=false node scripts/post_caribbean_tourism_v3.mjs --dry-run
```

### Check Posting History

```bash
# View all posts
cat scripts/posting_history.json | jq '.posts'

# View recent history
cat scripts/posting_history.json | jq '.history | .[-10:]'

# Check next posts in rotation
node scripts/post_caribbean_tourism_v3.mjs --dry-run | grep "Next posts"
```

### View Logs

```bash
# List log files
ls -lh logs/

# View today's log
tail -f logs/posting_$(date +%Y-%m-%d).log

# View recent logs
tail -100 logs/posting_$(date +%Y-%m-%d).log
```

### Session Maintenance

```bash
# Check if sessions exist
ls -lh ~/.substack-session.json ~/.twitter-session.json

# Refresh sessions (if expired)
HEADLESS=false node scripts/post_caribbean_tourism_v3.mjs --setup-login
```

---

## 🔄 Content Management

### Editing Existing Posts

```bash
# Edit content file
nano content/daily_posts_caribbean_tourism.md
```

**Format**:
```markdown
## Post 1: Your Title

**Title:** Main Title

**Subtitle:** Optional subtitle

**Content:**

Your article content here...

**Tags:** #CaribbeanTourism #YourTags
```

Changes take effect immediately on next run.

### Adding New Posts

1. Add new post to `content/daily_posts_caribbean_tourism.md`
2. Follow the same format as existing posts
3. Update the script if you want more than 6 posts (optional)

### Viewing Current Rotation

```bash
# See which posts are next
node scripts/post_caribbean_tourism_v3.mjs --dry-run
```

---

## 🚨 Troubleshooting

### Session Expired

**Symptom**: "Not logged in" errors or posts fail

**Solution**:
```bash
HEADLESS=false node scripts/post_caribbean_tourism_v3.mjs --setup-login
```

### Script Hangs or Fails

**Symptom**: Script doesn't complete or times out

**Solution**:
```bash
# Run with visible browser to see what's happening
HEADLESS=false node scripts/post_caribbean_tourism_v3.mjs --dry-run
```

Check if Substack/Twitter UI has changed and update selectors if needed.

### Wrong Posts Being Published

**Symptom**: Same posts repeating or incorrect rotation

**Solution**:
```bash
# Check posting history
cat scripts/posting_history.json | jq '.posts'

# Reset rotation (if needed)
rm scripts/posting_history.json
node scripts/post_caribbean_tourism_v3.mjs --dry-run
```

### Playwright Browser Issues

**Symptom**: Browser executable not found

**Solution**:
```bash
cd /home/ubuntu/quintapoo-memory
npx playwright install chromium
```

---

## 📁 File Structure

```
quintapoo-memory/
├── content/
│   └── daily_posts_caribbean_tourism.md    # 6 pre-written articles
├── scripts/
│   ├── post_caribbean_tourism_v3.mjs       # Main posting script (V3)
│   ├── post_caribbean_tourism_v2.mjs       # Previous version (backup)
│   ├── scheduled_post.sh                   # Scheduling wrapper script
│   └── posting_history.json                # Rotation tracking database
├── logs/                                    # Execution logs (created on first run)
└── ~/.substack-session.json                # Saved Substack login (home dir)
└── ~/.twitter-session.json                 # Saved Twitter login (home dir)
```

---

## 🔐 Security Notes

### Session Files

- Session cookies are stored in home directory (`~/.substack-session.json`, `~/.twitter-session.json`)
- **NOT committed to Git** (in `.gitignore`)
- Contain authentication tokens for automated posting
- Should be kept secure and private

### Credentials

- No passwords stored in code
- Sessions maintained via browser cookies
- Manual login required once to establish session
- Sessions persist across script executions

---

## 🚀 Next Steps

### 1. Complete Initial Login ⚠️

**Priority**: High  
**Action**: Run `HEADLESS=false node scripts/post_caribbean_tourism_v3.mjs --setup-login`  
**Time**: 5 minutes

### 2. Test First Posting

**Priority**: High  
**Action**: Run `node scripts/post_caribbean_tourism_v3.mjs`  
**Time**: 2 minutes

### 3. Monitor Scheduled Execution

**Priority**: Medium  
**Action**: Check logs after first scheduled run  
**Time**: Ongoing

### 4. Commit to GitHub (Optional)

```bash
cd /home/ubuntu/quintapoo-memory
git add .
git commit -m "Add V3 Caribbean tourism syndication with enhanced session management"
git push origin main
```

---

## 📈 Success Metrics

**Target Audience**: 320 Caribbean tourism businesses

**Expected Results**:
- ✅ 6 posts published per day (2 posts × 3 time slots)
- ✅ Even rotation across all 6 articles
- ✅ Consistent posting schedule (9 AM, 1 PM, 6 PM AST)
- ✅ Engagement tracking via Substack and Twitter analytics
- ✅ Autonomous operation without manual intervention

**KPIs to Track**:
- Daily post count (target: 6)
- Rotation balance (all posts should have similar counts)
- Success rate (target: >95%)
- Session uptime (days between re-login)

---

## 🆘 Support

### Quick Reference Commands

```bash
# Post now
node scripts/post_caribbean_tourism_v3.mjs

# Test without posting
node scripts/post_caribbean_tourism_v3.mjs --dry-run

# Refresh login
HEADLESS=false node scripts/post_caribbean_tourism_v3.mjs --setup-login

# Check history
cat scripts/posting_history.json | jq '.posts'

# View logs
tail -f logs/posting_$(date +%Y-%m-%d).log
```

### Common Issues

| Issue | Command |
|-------|---------|
| Session expired | `HEADLESS=false node scripts/post_caribbean_tourism_v3.mjs --setup-login` |
| Check rotation | `node scripts/post_caribbean_tourism_v3.mjs --dry-run` |
| View history | `cat scripts/posting_history.json \| jq '.posts'` |
| Reset rotation | `rm scripts/posting_history.json` |

---

## 📝 Version History

### V3 (Current) - February 4, 2026
- ✅ Separate Twitter session management
- ✅ Enhanced error handling (continues if one platform fails)
- ✅ Improved URL capture for both platforms
- ✅ Better selector fallbacks
- ✅ Date/time validation
- ✅ Setup login mode (`--setup-login`)
- ✅ Enhanced logging

### V2 - February 3, 2026
- ✅ Improved reliability
- ✅ Better error messages
- ✅ Substack session management
- ✅ Rotation tracking

### V1 - February 1-2, 2026
- ✅ Initial implementation
- ✅ Basic posting to Substack and Twitter
- ✅ Content parsing

---

**Last Updated**: February 4, 2026  
**Status**: ✅ Ready for production (pending initial login)  
**Repository**: `hypnoticproductions/new`
