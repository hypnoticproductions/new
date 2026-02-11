# WUKR Wire Daily Dispatch - Setup Guide

**Automated Caribbean Tourism Content Syndication**

This system automatically posts 2 Caribbean tourism articles to Substack and Twitter three times daily (9 AM, 1 PM, 6 PM AST), rotating through 6 posts to reach 320 Caribbean tourism businesses.

---

## 🎯 System Overview

**Schedule:**
- **9:00 AM AST** - Posts 1-2
- **1:00 PM AST** - Posts 3-4  
- **6:00 PM AST** - Posts 5-6

**Platforms:**
- Substack: https://richarddannibarrifortune.substack.com
- Twitter/X: https://x.com

**Features:**
- ✅ Intelligent rotation (never posted → least posted → oldest posted)
- ✅ Duplicate prevention (won't post same content twice in one day)
- ✅ Session persistence (autonomous operation)
- ✅ Time validation (ensures content freshness)
- ✅ JSON-based tracking (no database required)
- ✅ GitHub Actions scheduling (runs even when sandbox hibernates)

---

## 📋 Initial Setup (One-Time)

### Step 1: Set Up Platform Sessions

The script needs saved login sessions to post autonomously. Run this once:

```bash
cd /home/ubuntu/quintapoo-memory
node scripts/wukr_wire_dispatch.mjs --setup-login
```

This will:
1. Open a browser window for Substack
2. Wait 60 seconds for you to log in manually
3. Save the session to `~/.substack-session.json`
4. Repeat for Twitter
5. Save the session to `~/.twitter-session.json`

**Important:** Keep these session files secure. They allow autonomous posting.

### Step 2: Add Sessions to GitHub Secrets

For GitHub Actions to work, you need to add the session files as repository secrets:

1. **Get session file contents:**
   ```bash
   cat ~/.substack-session.json
   cat ~/.twitter-session.json
   ```

2. **Add to GitHub:**
   - Go to: https://github.com/hypnoticproductions/new/settings/secrets/actions
   - Click "New repository secret"
   - Name: `SUBSTACK_SESSION`
   - Value: Paste the entire contents of `~/.substack-session.json`
   - Click "Add secret"
   - Repeat for `TWITTER_SESSION` with contents of `~/.twitter-session.json`

### Step 3: Push Workflows to GitHub

```bash
cd /home/ubuntu/quintapoo-memory
git add .github/workflows/wukr-dispatch-*.yml
git add scripts/wukr_wire_dispatch.mjs
git add WUKR_WIRE_DISPATCH_SETUP.md
git commit -m "🚀 Add WUKR Wire automated dispatch system"
git push origin main
```

### Step 4: Enable GitHub Actions

1. Go to: https://github.com/hypnoticproductions/new/actions
2. If prompted, click "I understand my workflows, go ahead and enable them"
3. Verify the three workflows appear:
   - WUKR Wire Dispatch - Morning (9 AM AST)
   - WUKR Wire Dispatch - Afternoon (1 PM AST)
   - WUKR Wire Dispatch - Evening (6 PM AST)

---

## 🧪 Testing

### Test Locally (Dry Run)

```bash
cd /home/ubuntu/quintapoo-memory
node scripts/wukr_wire_dispatch.mjs --dry-run
```

This shows what would be posted without actually posting.

### Test Locally (Real Post)

```bash
cd /home/ubuntu/quintapoo-memory
node scripts/wukr_wire_dispatch.mjs --count=2 --platform=substack,twitter
```

**Note:** The script will pause for manual confirmation when publishing. This is by design to ensure quality control during testing.

### Test GitHub Actions (Manual Trigger)

1. Go to: https://github.com/hypnoticproductions/new/actions
2. Click on "WUKR Wire Dispatch - Morning (9 AM AST)"
3. Click "Run workflow" → "Run workflow"
4. Monitor the execution in the Actions tab

---

## 📊 Monitoring

### Check Posting History

```bash
cd /home/ubuntu/quintapoo-memory
cat scripts/posting_history.json | jq '.history | .[-10:]'
```

This shows the last 10 posting events.

### View Post Rotation Status

```bash
cd /home/ubuntu/quintapoo-memory
cat scripts/posting_history.json | jq '.posts'
```

This shows each post's status:
- `postCount`: How many times it's been posted
- `lastPostedAt`: When it was last posted
- `substackUrl`: Latest Substack URL
- `twitterUrl`: Latest Twitter URL

### GitHub Actions Logs

1. Go to: https://github.com/hypnoticproductions/new/actions
2. Click on any workflow run
3. Expand the steps to see detailed logs

---

## 🔧 Maintenance

### Update Session Files

Sessions expire after ~30 days. When posting fails with "not logged in" errors:

```bash
cd /home/ubuntu/quintapoo-memory
node scripts/wukr_wire_dispatch.mjs --setup-login
```

Then update GitHub secrets with the new session files.

### Update Content

Edit the content file:

```bash
nano /home/ubuntu/quintapoo-memory/content/daily_posts_caribbean_tourism.md
```

Then commit and push:

```bash
git add content/daily_posts_caribbean_tourism.md
git commit -m "📝 Update Caribbean tourism content"
git push origin main
```

The next scheduled run will use the updated content.

### Pause Automation

To temporarily stop all posting:

1. Go to: https://github.com/hypnoticproductions/new/actions
2. Click on each workflow
3. Click "..." → "Disable workflow"

### Resume Automation

1. Go to: https://github.com/hypnoticproductions/new/actions
2. Click on each workflow
3. Click "Enable workflow"

---

## 🎛️ Configuration

### Change Posting Times

Edit the cron schedules in `.github/workflows/wukr-dispatch-*.yml`:

```yaml
schedule:
  - cron: '0 13 * * *'  # 9 AM AST = 1 PM UTC
```

**AST to UTC conversion:** AST is UTC-4, so add 4 hours.
- 9 AM AST = 1 PM UTC = `0 13 * * *`
- 1 PM AST = 5 PM UTC = `0 17 * * *`
- 6 PM AST = 10 PM UTC = `0 22 * * *`

### Change Post Count

Edit the `--count` parameter in the workflow files:

```yaml
run: node scripts/wukr_wire_dispatch.mjs --count=2
```

### Change Platforms

Edit the `--platform` parameter:

```yaml
run: node scripts/wukr_wire_dispatch.mjs --platform=substack,twitter
```

Options: `substack`, `twitter`, or both (comma-separated)

---

## 🚨 Troubleshooting

### "Session not found" error

**Solution:** Run `--setup-login` again and update GitHub secrets.

### Posts not rotating correctly

**Solution:** Check `posting_history.json` for corruption. Delete it to reset:

```bash
rm /home/ubuntu/quintapoo-memory/scripts/posting_history.json
```

The script will recreate it on next run.

### GitHub Actions not running

**Possible causes:**
1. Workflows not enabled (check Actions tab)
2. Repository is private and out of Actions minutes
3. Cron schedule is in the future

**Solution:** Trigger manually to test, then check logs.

### Browser automation fails in headless mode

**Solution:** Test locally with visible browser:

```bash
HEADLESS=false node scripts/wukr_wire_dispatch.mjs --count=1
```

This helps debug Playwright issues.

---

## 📁 File Structure

```
quintapoo-memory/
├── .github/
│   └── workflows/
│       ├── wukr-dispatch-morning.yml      # 9 AM AST workflow
│       ├── wukr-dispatch-afternoon.yml    # 1 PM AST workflow
│       └── wukr-dispatch-evening.yml      # 6 PM AST workflow
├── content/
│   └── daily_posts_caribbean_tourism.md   # 6 posts content
├── scripts/
│   ├── wukr_wire_dispatch.mjs             # Main dispatch script
│   └── posting_history.json               # Tracking database
└── WUKR_WIRE_DISPATCH_SETUP.md           # This file
```

---

## 🎯 Success Criteria

✅ **Automation is working when:**
- GitHub Actions runs 3 times daily (check Actions tab)
- `posting_history.json` updates after each run
- Posts appear on Substack and Twitter
- Each of the 6 posts rotates fairly (similar `postCount`)
- No duplicate posts on the same day

---

## 📞 Support

**Check these first:**
1. GitHub Actions logs: https://github.com/hypnoticproductions/new/actions
2. Posting history: `scripts/posting_history.json`
3. Session validity: Re-run `--setup-login` if sessions expire

**Common issues:**
- Sessions expire → Re-run setup
- Content not updating → Check git push succeeded
- Rotation stuck → Delete `posting_history.json` to reset

---

## 🚀 Next Steps

After setup is complete:

1. ✅ Monitor the first few automated runs
2. ✅ Verify posts reach target audience (320 Caribbean tourism businesses)
3. ✅ Track engagement metrics on Substack and Twitter
4. ✅ Adjust content based on performance
5. ✅ Consider expanding to additional platforms (LinkedIn, Facebook)

**The system is now autonomous and will run daily without intervention.**

---

*Last updated: February 11, 2026*
*System: WUKR Wire Daily Dispatch v1.0*
*Target: 320 Caribbean tourism businesses*
*Frequency: 3x daily (9 AM, 1 PM, 6 PM AST)*
