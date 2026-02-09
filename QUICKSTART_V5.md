# Caribbean Tourism Posting - Quick Reference

## One-Time Setup (5 minutes)

```bash
# 1. Initialize database
cd /home/ubuntu/quintapoo-memory
node scripts/initialize_posts_db.mjs

# 2. Set up login sessions (opens browser windows)
node scripts/post_caribbean_now_v5.mjs --setup-login

# 3. Test posting (dry run)
node scripts/post_caribbean_now_v5.mjs --dry-run --count=2

# 4. Enable automated posting
./scripts/schedule_caribbean_v5.sh install
```

## Daily Commands

```bash
# Check status
./scripts/schedule_caribbean_v5.sh status

# Post now (manual)
node scripts/post_caribbean_now_v5.mjs --count=2

# View logs
tail -f logs/posting_09am.log
tail -f logs/posting_01pm.log
tail -f logs/posting_06pm.log
```

## Posting Schedule

| Time (AST) | Posts | Cron (UTC) |
|------------|-------|------------|
| 9:00 AM    | 2     | 13:00      |
| 1:00 PM    | 2     | 17:00      |
| 6:00 PM    | 2     | 22:00      |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Not logged in | `node scripts/post_caribbean_now_v5.mjs --setup-login` |
| Session expired | Same as above |
| Posts not rotating | `node scripts/initialize_posts_db.mjs` |
| Cron not running | `systemctl status cron` |

## File Locations

- **Content**: `content/daily_posts_caribbean_tourism.md`
- **Database**: `scripts/posting_history.json`
- **Sessions**: `~/.substack-session.json`, `~/.twitter-session.json`
- **Logs**: `logs/posting_*.log`

## Quick Checks

```bash
# View next posts to publish
cat scripts/posting_history.json | jq '.posts | sort_by(.postCount) | .[0:2] | .[] | {post: .postNumber, title: .title, count: .postCount}'

# View recent posting history
cat scripts/posting_history.json | jq '.history | sort_by(.postedAt) | reverse | .[0:5]'

# Count posts by platform
cat scripts/posting_history.json | jq '.history | group_by(.platform) | map({platform: .[0].platform, count: length})'
```

## Emergency Commands

```bash
# Stop all automated posting
./scripts/schedule_caribbean_v5.sh uninstall

# Restart automated posting
./scripts/schedule_caribbean_v5.sh install

# Clear all sessions (force re-login)
rm ~/.substack-session.json ~/.twitter-session.json

# Reset database (keeps history)
node scripts/initialize_posts_db.mjs
```

## Success Indicators

✅ Cron jobs installed  
✅ Sessions valid  
✅ 6 posts in database  
✅ Posting history growing  
✅ Logs updating 3x daily  
✅ All posts have similar post counts  

---

**For detailed documentation, see:** `CARIBBEAN_POSTING_GUIDE_V5.md`
