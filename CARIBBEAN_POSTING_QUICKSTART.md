# Caribbean Tourism Posting - Quick Start

## 🚀 Quick Commands

### First Time Setup (Login to Platforms)
```bash
cd /home/ubuntu/quintapoo-memory
HEADLESS=false node scripts/post_caribbean_wukr.mjs --setup-login --dry-run
```
Log in to Substack and Twitter when the browser opens. Sessions will be saved.

### Test Posting (Dry Run)
```bash
cd /home/ubuntu/quintapoo-memory
node scripts/post_caribbean_wukr.mjs --dry-run
```

### Live Posting (2 articles)
```bash
cd /home/ubuntu/quintapoo-memory
node scripts/post_caribbean_wukr.mjs
```

### Using Shell Wrapper
```bash
cd /home/ubuntu/quintapoo-memory
./scripts/run_caribbean_posting.sh           # Live posting
./scripts/run_caribbean_posting.sh --dry-run # Test mode
```

## 📅 Scheduling

### Recommended Schedule (Atlantic Standard Time)
- **9:00 AM AST** - Posts 1-2
- **1:00 PM AST** - Posts 3-4
- **6:00 PM AST** - Posts 5-6

### Using cron-job.org
1. Create account at https://cron-job.org
2. Add 3 cron jobs with these schedules:
   - `0 9 * * *` (9 AM)
   - `0 13 * * *` (1 PM)
   - `0 18 * * *` (6 PM)
3. Command: `cd /home/ubuntu/quintapoo-memory && ./scripts/run_caribbean_posting.sh`

## 📊 Monitoring

### Check Posting History
```bash
cat /home/ubuntu/quintapoo-memory/scripts/posting_history.json
```

### View Logs
```bash
tail -f /home/ubuntu/quintapoo-memory/logs/caribbean_posting_$(date +%Y%m%d).log
```

### Check Rotation Status
```bash
cd /home/ubuntu/quintapoo-memory/scripts
node -e "const d=require('./posting_history.json'); d.posts.forEach(p=>console.log(\`Post \${p.postNumber}: \${p.postCount} times\`));"
```

## 🔧 Troubleshooting

### Session Expired
```bash
rm ~/.substack-session.json ~/.twitter-session.json
HEADLESS=false node scripts/post_caribbean_wukr.mjs --setup-login --dry-run
```

### Reset Posting History
```bash
rm /home/ubuntu/quintapoo-memory/scripts/posting_history.json
node scripts/post_caribbean_wukr.mjs --dry-run  # Reinitialize
```

## 📝 Files

- **Content**: `/home/ubuntu/quintapoo-memory/content/daily_posts_caribbean_tourism.md`
- **Script**: `/home/ubuntu/quintapoo-memory/scripts/post_caribbean_wukr.mjs`
- **History**: `/home/ubuntu/quintapoo-memory/scripts/posting_history.json`
- **Logs**: `/home/ubuntu/quintapoo-memory/logs/`

## 🎯 Target

**320 Caribbean tourism businesses**  
**Platforms**: Substack (primary), Twitter (secondary)  
**Frequency**: 6 posts/day (2 posts × 3 time slots)

---

For full documentation, see: `WUKR_CARIBBEAN_POSTING_GUIDE.md`
