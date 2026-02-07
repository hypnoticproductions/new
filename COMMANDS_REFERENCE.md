# Caribbean Tourism Syndication System V4 - Command Reference

Quick reference for all system commands.

---

## Setup Commands (One-Time)

```bash
# Navigate to project
cd /home/ubuntu/quintapoo-memory

# Install dependencies (if needed)
pnpm install playwright
npx playwright install chromium

# Setup login sessions for Substack and Twitter
node scripts/post_caribbean_now_v4.mjs --setup-login
```

---

## Posting Commands

### Test & Dry Run

```bash
# Dry run - see what would be posted without actually posting
node scripts/post_caribbean_now_v4.mjs --dry-run --count=2

# Dry run with 4 posts
node scripts/post_caribbean_now_v4.mjs --dry-run --count=4
```

### Manual Posting

```bash
# Post next 2 articles to both Substack and Twitter
node scripts/post_caribbean_now_v4.mjs --count=2

# Post next 4 articles
node scripts/post_caribbean_now_v4.mjs --count=4

# Post to Substack only
node scripts/post_caribbean_now_v4.mjs --platforms=substack --count=2

# Post to Twitter only
node scripts/post_caribbean_now_v4.mjs --platforms=twitter --count=2

# Debug mode - show browser window
HEADLESS=false node scripts/post_caribbean_now_v4.mjs --count=2
```

---

## Schedule Management

```bash
# Install automated posting schedule (9 AM, 1 PM, 6 PM AST)
./scripts/schedule_caribbean_v4.sh install

# Check schedule status and recent logs
./scripts/schedule_caribbean_v4.sh status

# Remove automated schedule
./scripts/schedule_caribbean_v4.sh remove

# View current cron jobs
crontab -l

# Edit cron jobs manually
crontab -e
```

---

## Monitoring & Logs

```bash
# View all logs in real-time
tail -f logs/caribbean_*.log

# View specific time slot logs
tail -f logs/caribbean_9am.log
tail -f logs/caribbean_1pm.log
tail -f logs/caribbean_6pm.log

# View last 50 lines of all logs
tail -n 50 logs/caribbean_*.log

# Check posting history
cat scripts/posting_history.json

# View posting history in formatted JSON
cat scripts/posting_history.json | python3 -m json.tool
```

---

## Maintenance Commands

```bash
# Backup posting history
cp scripts/posting_history.json scripts/posting_history_backup_$(date +%Y%m%d).json

# Reset posting history (start fresh)
rm scripts/posting_history.json
node scripts/post_caribbean_now_v4.mjs --dry-run

# Refresh login sessions (monthly)
node scripts/post_caribbean_now_v4.mjs --setup-login

# Update content file
vim content/daily_posts_caribbean_tourism.md
```

---

## Git Commands

```bash
# Check status
git status

# View recent changes
git diff

# Commit changes
git add -A
git commit -m "Your commit message"
git push origin main

# Pull latest changes
git pull origin main

# View commit history
git log --oneline -10
```

---

## Troubleshooting Commands

```bash
# Test content parsing
node scripts/post_caribbean_now_v4.mjs --dry-run

# Run with visible browser for debugging
HEADLESS=false node scripts/post_caribbean_now_v4.mjs --count=1

# Check if Playwright is installed
npx playwright --version

# Reinstall Playwright browsers
npx playwright install chromium

# Check Node.js version
node --version

# Check pnpm version
pnpm --version

# View system logs
journalctl -u cron -n 50

# Check disk space
df -h

# Check memory usage
free -h
```

---

## File Locations

```bash
# Main posting script
scripts/post_caribbean_now_v4.mjs

# Schedule installer
scripts/schedule_caribbean_v4.sh

# Content file (6 posts)
content/daily_posts_caribbean_tourism.md

# Posting history database
scripts/posting_history.json

# Session files
~/.substack-session.json
~/.twitter-session.json

# Log files
logs/caribbean_9am.log
logs/caribbean_1pm.log
logs/caribbean_6pm.log

# Documentation
CARIBBEAN_POSTING_QUICKSTART_V4.md
CARIBBEAN_TOURISM_SYSTEM_V4_SUMMARY.md
COMMANDS_REFERENCE.md
```

---

## Common Workflows

### First-Time Setup
```bash
cd /home/ubuntu/quintapoo-memory
node scripts/post_caribbean_now_v4.mjs --setup-login
node scripts/post_caribbean_now_v4.mjs --dry-run --count=2
node scripts/post_caribbean_now_v4.mjs --count=2
./scripts/schedule_caribbean_v4.sh install
```

### Daily Monitoring
```bash
./scripts/schedule_caribbean_v4.sh status
tail -f logs/caribbean_*.log
```

### Weekly Maintenance
```bash
./scripts/schedule_caribbean_v4.sh status
cp scripts/posting_history.json scripts/posting_history_backup_$(date +%Y%m%d).json
git add -A && git commit -m "Weekly backup" && git push origin main
```

### Monthly Refresh
```bash
node scripts/post_caribbean_now_v4.mjs --setup-login
vim content/daily_posts_caribbean_tourism.md
git add -A && git commit -m "Monthly content update" && git push origin main
```

---

## Environment Variables

```bash
# Run in non-headless mode (show browser)
HEADLESS=false node scripts/post_caribbean_now_v4.mjs

# Custom timeout (in milliseconds)
TIMEOUT=120000 node scripts/post_caribbean_now_v4.mjs

# Set timezone for cron jobs
TZ=America/Puerto_Rico crontab -l
```

---

## Quick Checks

```bash
# Is the system running?
./scripts/schedule_caribbean_v4.sh status

# What posts will be published next?
node scripts/post_caribbean_now_v4.mjs --dry-run --count=2

# How many times has each post been published?
cat scripts/posting_history.json | grep -A 5 '"posts"'

# What was the last posting time?
tail -n 20 logs/caribbean_*.log | grep "Posted to"

# Are login sessions valid?
ls -lh ~/.substack-session.json ~/.twitter-session.json
```

---

## Emergency Commands

```bash
# Stop all posting immediately
./scripts/schedule_caribbean_v4.sh remove

# Kill any running posting processes
pkill -f post_caribbean_now_v4.mjs

# Check for stuck processes
ps aux | grep post_caribbean

# Clear all logs
rm logs/caribbean_*.log

# Reset everything (nuclear option)
./scripts/schedule_caribbean_v4.sh remove
rm scripts/posting_history.json
rm ~/.substack-session.json ~/.twitter-session.json
```

---

## Performance Optimization

```bash
# Run posting in background
nohup node scripts/post_caribbean_now_v4.mjs --count=2 > logs/manual_post.log 2>&1 &

# Check background processes
jobs

# Monitor system resources during posting
htop

# Check network usage
nethogs
```

---

**Pro Tip:** Bookmark this file for quick access to all commands.

**Location:** `/home/ubuntu/quintapoo-memory/COMMANDS_REFERENCE.md`
