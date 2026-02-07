# Caribbean Tourism Posting System - Quick Start Guide

**🎯 Goal:** Post 2 Caribbean tourism articles to Substack and Twitter, 3 times daily (9 AM, 1 PM, 6 PM AST)  
**📊 Content:** 6 posts rotating automatically to avoid duplicates  
**👥 Audience:** 320 Caribbean tourism businesses

---

## ⚡ Quick Start (3 Steps)

### Step 1: Capture Login Sessions (One-Time Setup)

```bash
cd /home/ubuntu/quintapoo-memory
node scripts/capture_sessions.mjs
```

This will:
- Open browsers for Substack and Twitter
- Wait 60 seconds for you to log in
- Save session cookies for autonomous operation
- Sessions last ~30 days

**Note:** If you don't have a display server (headless environment), see the manual session capture guide in `CARIBBEAN_POSTING_SETUP_GUIDE.md`.

---

### Step 2: Test with Dry Run

```bash
./scripts/post_now.sh --dry-run
```

This will:
- Show which 2 posts will be published next
- Display formatted content for Substack and Twitter
- Update posting history (but not actually post)
- Verify rotation logic is working

---

### Step 3: Post Your First 2 Articles

```bash
./scripts/post_now.sh
```

This will:
- Post 2 articles to Substack (full content)
- Post 2 tweets with links back to Substack
- Update posting history
- Display success confirmation with URLs

---

## 🤖 Set Up Automated Posting (Optional)

```bash
./scripts/setup_schedule.sh
```

This will:
- Create cron jobs for 9 AM, 1 PM, and 6 PM AST
- Set up logging for each posting session
- Enable fully autonomous operation

**After setup, the system will:**
- Post 2 articles at 9 AM AST (Posts 1-2 on day 1, Posts 3-4 on day 2, etc.)
- Post 2 articles at 1 PM AST (continuing rotation)
- Post 2 articles at 6 PM AST (continuing rotation)
- Rotate through all 6 posts evenly
- Never duplicate posts within short timeframes

---

## 📊 Current Posting Status

Run this to see which posts will be next:

```bash
node scripts/post_caribbean_rotation.mjs --dry-run | grep -A 10 "Selected posts"
```

**Current rotation (as of last run):**
- Posts 5 & 6 are next (lowest post count: 8)
- Posts 1-4 have been posted 9 times each
- All posts are rotating evenly

---

## 🔧 Common Commands

| Command | Description |
|---------|-------------|
| `./scripts/post_now.sh` | Post 2 articles now |
| `./scripts/post_now.sh --dry-run` | Test without posting |
| `node scripts/post_caribbean_rotation.mjs --count=3` | Post 3 articles |
| `node scripts/capture_sessions.mjs substack` | Recapture Substack session |
| `node scripts/capture_sessions.mjs twitter` | Recapture Twitter session |
| `cat scripts/posting_history.json` | View posting history |
| `tail -f logs/posts_09am.log` | Monitor 9 AM posting logs |

---

## 📁 File Structure

```
quintapoo-memory/
├── content/
│   └── daily_posts_caribbean_tourism.md    # 6 Caribbean tourism posts
├── scripts/
│   ├── post_caribbean_rotation.mjs         # Main posting script
│   ├── capture_sessions.mjs                # Session capture helper
│   ├── post_now.sh                         # Quick post script
│   ├── setup_schedule.sh                   # Automated scheduling
│   └── posting_history.json                # Posting database
├── logs/                                    # Posting logs (created on first run)
├── CARIBBEAN_POSTING_SETUP_GUIDE.md        # Detailed documentation
└── QUICKSTART_CARIBBEAN_POSTING_V2.md      # This file
```

---

## 🎯 How Rotation Works

The system selects posts based on this priority:

1. **Never posted** → Posts that have never been published
2. **Least posted** → Posts with the lowest post count
3. **Oldest posted** → Posts with the oldest timestamp
4. **Sequential** → Post 1, 2, 3, 4, 5, 6 in order

**Example rotation over 3 days:**
- Day 1, 9 AM: Posts 1 & 2
- Day 1, 1 PM: Posts 3 & 4
- Day 1, 6 PM: Posts 5 & 6
- Day 2, 9 AM: Posts 1 & 2 (rotation starts over)
- Day 2, 1 PM: Posts 3 & 4
- Day 2, 6 PM: Posts 5 & 6
- And so on...

This ensures even distribution and prevents any post from being over-used.

---

## 🐛 Troubleshooting

### "No saved session found"

**Problem:** Session files don't exist.

**Solution:**
```bash
node scripts/capture_sessions.mjs
```

---

### "Session expired" or "Login failed"

**Problem:** Session cookies expired (typically after 30 days).

**Solution:**
```bash
# Delete old sessions
rm ~/.substack-session.json ~/.twitter-session.json

# Capture new sessions
node scripts/capture_sessions.mjs
```

---

### Posts not rotating correctly

**Problem:** Posting history corrupted or not updating.

**Solution:**
```bash
# Backup current history
cp scripts/posting_history.json scripts/posting_history.backup.json

# Check the file
cat scripts/posting_history.json | head -50

# If corrupted, restore from backup or reset
```

---

### Can't open browser (headless environment)

**Problem:** No display server available for browser automation.

**Solution:** Use manual session capture:
1. Log in to Substack and Twitter in your local browser
2. Export cookies using a browser extension (Cookie-Editor, EditThisCookie)
3. Save to `~/.substack-session.json` and `~/.twitter-session.json`
4. Transfer files to the server

See `CARIBBEAN_POSTING_SETUP_GUIDE.md` for detailed instructions.

---

## 📈 Monitoring and Analytics

### View posting statistics

```bash
node scripts/post_caribbean_rotation.mjs --dry-run | grep -A 15 "POSTING STATISTICS"
```

### Count posts by platform

```bash
cat scripts/posting_history.json | grep '"platform"' | sort | uniq -c
```

### View recent posts

```bash
cat scripts/posting_history.json | grep '"postedAt"' | tail -10
```

### Check cron job status

```bash
crontab -l | grep Caribbean
```

---

## 🔐 Security Notes

- ✅ Session files are in `.gitignore` (never committed)
- ✅ Sessions stored in home directory (`~/.substack-session.json`, `~/.twitter-session.json`)
- ✅ Sessions expire after ~30 days (automatic security)
- ⚠️ Never share session files (they contain your login cookies)
- ⚠️ Recapture sessions if you suspect unauthorized access

---

## 📚 Additional Resources

- **Detailed Setup Guide:** `CARIBBEAN_POSTING_SETUP_GUIDE.md`
- **Original Playbook:** See the playbook in the task description
- **Content File:** `content/daily_posts_caribbean_tourism.md`
- **Script Source:** `scripts/post_caribbean_rotation.mjs`

---

## ✅ Success Checklist

Before going fully autonomous, verify:

- [ ] Sessions captured for Substack and Twitter
- [ ] Dry run completes without errors
- [ ] First 2 articles post successfully
- [ ] Posting history updates correctly
- [ ] Rotation logic selects correct posts
- [ ] Cron jobs scheduled (if using automation)
- [ ] Logs directory created and writable

---

## 🚀 Ready to Go Live?

Once you've completed the checklist above:

1. **Manual posting:** Use `./scripts/post_now.sh` whenever you want to post
2. **Automated posting:** Run `./scripts/setup_schedule.sh` for hands-free operation
3. **Monitor:** Check logs in `logs/` directory
4. **Maintain:** Recapture sessions every 30 days

---

## 💡 Pro Tips

1. **Test first:** Always run `--dry-run` before posting to verify content
2. **Monitor logs:** Check logs after first few automated runs
3. **Backup history:** Keep backups of `posting_history.json`
4. **Update content:** Edit `content/daily_posts_caribbean_tourism.md` anytime
5. **Session refresh:** Set a calendar reminder to recapture sessions every 30 days

---

## 🎉 You're All Set!

The system is ready to post Caribbean tourism content to your 320 target businesses. Start with a dry run, then post your first 2 articles!

```bash
# Test it
./scripts/post_now.sh --dry-run

# Post it
./scripts/post_now.sh

# Automate it
./scripts/setup_schedule.sh
```

**Questions?** See `CARIBBEAN_POSTING_SETUP_GUIDE.md` for detailed documentation.

---

**System Version:** 2.0  
**Last Updated:** February 7, 2026  
**Status:** ✅ Ready for Production
