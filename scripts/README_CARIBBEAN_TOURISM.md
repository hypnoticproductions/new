# Caribbean Tourism Content Syndication System

Automated content posting system for distributing Caribbean tourism articles to Substack and Twitter with intelligent rotation to avoid duplicates.

## Overview

This system posts **2 Caribbean tourism articles** at scheduled times throughout the day:
- **9:00 AM AST** - Posts 1-2
- **1:00 PM AST** - Posts 3-4  
- **6:00 PM AST** - Posts 5-6

The system automatically rotates through 6 pre-written articles, tracking posting history to ensure even distribution and avoid duplicates.

**Target Audience**: 320 Caribbean tourism businesses

## Files Structure

```
quintapoo-memory/
├── content/
│   └── daily_posts_caribbean_tourism.md    # 6 pre-written articles
├── scripts/
│   ├── post_caribbean_tourism.mjs          # Main posting script
│   ├── posting_history.json                # Rotation tracking database
│   ├── schema.sql                          # PostgreSQL schema (for production)
│   └── README_CARIBBEAN_TOURISM.md         # This file
└── .substack-session.json                  # Saved Substack login session
```

## Features

### Intelligent Rotation Logic
- Tracks which posts have been published and when
- Automatically selects the least-recently-posted content
- Ensures all 6 posts are rotated evenly before repeating
- Prevents duplicate content from being posted too frequently

### Multi-Platform Publishing
- **Substack**: Full article with title, subtitle, and formatted content
- **Twitter**: Concise 280-character summary with link to Substack article

### Session Management
- Saves Substack login session for autonomous operation
- No need to log in manually for each run (after initial setup)

### Error Handling
- Graceful failure handling for each platform
- Detailed logging of all posting attempts
- Continues posting even if one platform fails

### Dry-Run Mode
- Test the system without actually posting
- Verify content formatting and rotation logic
- Safe for development and debugging

## Initial Setup

### 1. Install Dependencies

The system requires Playwright for browser automation:

```bash
cd /home/ubuntu/quintapoo-memory
pnpm add playwright
pnpm exec playwright install chromium
```

### 2. First-Time Login (Substack)

You need to log in to Substack once to save your session:

```bash
# Run with visible browser to perform login
HEADLESS=false node scripts/post_caribbean_tourism.mjs --dry-run
```

When the browser opens:
1. Navigate to your Substack publish page
2. Log in with your credentials
3. The script will save your session to `~/.substack-session.json`
4. Future runs will use this saved session

### 3. First-Time Login (Twitter)

Similarly for Twitter:

```bash
# Run with visible browser to perform login
HEADLESS=false node scripts/post_caribbean_tourism.mjs --dry-run
```

Note: Twitter session management is more complex. You may need to log in each time, or implement cookie-based session saving.

## Usage

### Basic Usage

Post 2 articles to both platforms:

```bash
cd /home/ubuntu/quintapoo-memory
node scripts/post_caribbean_tourism.mjs
```

### Dry-Run Mode

Test without actually posting:

```bash
node scripts/post_caribbean_tourism.mjs --dry-run
```

### Visible Browser Mode

Run with visible browser for debugging:

```bash
HEADLESS=false node scripts/post_caribbean_tourism.mjs --dry-run
```

### Check Rotation Status

View the posting history:

```bash
cat scripts/posting_history.json | jq '.posts'
```

This shows which posts have been published and when.

## Scheduling

### Using Cron (Linux/Mac)

Schedule the script to run 3 times daily:

```bash
# Edit crontab
crontab -e

# Add these lines (adjust timezone as needed)
0 9 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_tourism.mjs >> logs/caribbean_tourism.log 2>&1
0 13 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_tourism.mjs >> logs/caribbean_tourism.log 2>&1
0 18 * * * cd /home/ubuntu/quintapoo-memory && node scripts/post_caribbean_tourism.mjs >> logs/caribbean_tourism.log 2>&1
```

### Using GitHub Actions

Create `.github/workflows/caribbean-tourism-posts.yml`:

```yaml
name: Caribbean Tourism Posts

on:
  schedule:
    # 9 AM, 1 PM, 6 PM AST (UTC-4)
    - cron: '0 13 * * *'  # 9 AM AST
    - cron: '0 17 * * *'  # 1 PM AST
    - cron: '0 22 * * *'  # 6 PM AST
  workflow_dispatch:  # Allow manual trigger

jobs:
  post:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          npm install -g pnpm
          pnpm install
          pnpm exec playwright install chromium
      - name: Post articles
        run: node scripts/post_caribbean_tourism.mjs
        env:
          HEADLESS: true
```

## Content Management

### Editing Articles

Edit the content file at `content/daily_posts_caribbean_tourism.md`:

```markdown
## Post 1: Your Title Here

**Title:** Main Title

**Subtitle:** Optional subtitle

**Content:**

Your article content here...

**Tags:** #CaribbeanTourism #YourTags
```

The script automatically parses this format.

### Adding New Articles

To add more than 6 articles:

1. Add new posts to the content file following the same format
2. The script will automatically detect and include them in rotation
3. Update the posting schedule if needed

### Updating Existing Articles

Simply edit the content in `daily_posts_caribbean_tourism.md`. The script reads from this file each time it runs, so changes take effect immediately.

## Monitoring

### Check Posting History

View all posting attempts:

```bash
cat scripts/posting_history.json | jq '.history'
```

### View Next Posts in Rotation

The script shows this at the end of each run, or check manually:

```bash
node scripts/post_caribbean_tourism.mjs --dry-run | grep "Next posts"
```

### Check Substack Session Status

Verify your saved session:

```bash
ls -la ~/.substack-session.json
```

If this file is missing, you'll need to log in again.

## Troubleshooting

### "Not logged in to Substack"

**Problem**: Session expired or not saved

**Solution**:
```bash
HEADLESS=false node scripts/post_caribbean_tourism.mjs --dry-run
```
Log in manually when the browser opens.

### "Not logged in to Twitter"

**Problem**: Twitter doesn't maintain session

**Solution**: 
1. Consider using Twitter API instead of browser automation
2. Or log in manually each time with `HEADLESS=false`

### Script Hangs or Times Out

**Problem**: Browser automation waiting for elements that don't exist

**Solution**:
1. Run with `HEADLESS=false` to see what's happening
2. Check if Substack/Twitter UI has changed
3. Update selectors in the script if needed

### Posts Not Rotating Correctly

**Problem**: Same posts being published repeatedly

**Solution**:
1. Check `scripts/posting_history.json` for corruption
2. Delete the file to reset rotation (will start from Post 1)
3. Verify the content file has all 6 posts

### Content Not Parsing Correctly

**Problem**: Titles or content missing in posts

**Solution**:
1. Verify the content file follows the exact format
2. Run in dry-run mode to see what's being parsed
3. Check for special characters that might break parsing

## Advanced Configuration

### Change Posting Frequency

Edit the script's `CONFIG` object:

```javascript
const CONFIG = {
    // ... other settings
    postsPerRun: 2,  // Change to 1 or 3
};
```

### Change Target Platforms

The script currently supports Substack and Twitter. To add more platforms:

1. Create a new publisher class (e.g., `LinkedInPublisher`)
2. Implement `initialize()`, `checkLoginStatus()`, and `publish()` methods
3. Add to the main execution flow

### Use Real Database Instead of JSON

For production, use the PostgreSQL schema provided in `schema.sql`:

1. Set up a PostgreSQL database
2. Run the schema: `psql -d your_db -f scripts/schema.sql`
3. Update the script to use `pg` library instead of JSON file
4. Set `DATABASE_URL` environment variable

## Database Schema (Production)

For production deployments, use PostgreSQL with the provided schema:

```bash
# Create database
createdb caribbean_tourism

# Load schema
psql -d caribbean_tourism -f scripts/schema.sql

# Verify
psql -d caribbean_tourism -c "SELECT * FROM caribbean_tourism_posts;"
```

The schema includes:
- `caribbean_tourism_posts` - The 6 articles and their metadata
- `posting_history` - Detailed log of all posting attempts
- `syndication_schedule` - Schedule configuration
- `platform_credentials` - Platform authentication status

## Environment Variables

```bash
# Browser mode
export HEADLESS=false  # Show browser (default: true)

# Database (for production)
export DATABASE_URL=postgresql://user:pass@localhost/caribbean_tourism

# Timeout settings
export TIMEOUT=30000  # Milliseconds (default: 30000)
```

## API Reference

### PostingDatabase Class

```javascript
const db = new PostingDatabase();
await db.load();                           // Load from JSON file
const posts = db.getNextPostsToPublish(2); // Get next N posts
db.markPostPublished(postId, platform, url); // Mark as published
db.logError(postId, platform, error);      // Log error
await db.save();                           // Save to JSON file
```

### ContentParser Class

```javascript
const parser = new ContentParser(filePath);
await parser.parse();                      // Parse content file
const post = parser.getPost(postNumber);   // Get specific post
```

### SubstackPublisher Class

```javascript
const publisher = new SubstackPublisher(config);
await publisher.initialize();              // Launch browser
const loggedIn = await publisher.checkLoginStatus();
const url = await publisher.publish(post); // Publish article
await publisher.saveSession();             // Save login session
await publisher.close();                   // Close browser
```

### TwitterPublisher Class

```javascript
const publisher = new TwitterPublisher(config);
await publisher.initialize();              // Launch browser
const loggedIn = await publisher.checkLoginStatus();
const url = await publisher.publish(post, substackUrl); // Post tweet
await publisher.close();                   // Close browser
```

## Security Considerations

### Session Files

The `.substack-session.json` file contains authentication cookies. Keep it secure:

```bash
# Ensure proper permissions
chmod 600 ~/.substack-session.json

# Add to .gitignore
echo ".substack-session.json" >> .gitignore
```

### Credentials

Never commit credentials to the repository:

```bash
# Use environment variables for sensitive data
export SUBSTACK_EMAIL=your@email.com
export SUBSTACK_PASSWORD=your_password
```

### API Keys

If using Twitter API instead of browser automation:

```bash
export TWITTER_API_KEY=your_key
export TWITTER_API_SECRET=your_secret
export TWITTER_ACCESS_TOKEN=your_token
export TWITTER_ACCESS_SECRET=your_secret
```

## Performance Optimization

### Reduce Browser Launch Time

Keep browser context alive between posts:

```javascript
// Instead of launching new browser each time
// Launch once and reuse context
```

### Parallel Publishing

Publish to multiple platforms simultaneously:

```javascript
// Use Promise.all for parallel execution
const results = await Promise.all([
    substackPublisher.publish(post),
    twitterPublisher.publish(post)
]);
```

### Cache Content Parsing

Parse content file once and cache results:

```javascript
// Cache parsed posts in memory
const cachedPosts = await parser.parse();
```

## Maintenance

### Regular Tasks

**Weekly**:
- Review posting history for errors
- Check that all 6 posts are rotating evenly
- Verify Substack session is still valid

**Monthly**:
- Update article content with fresh information
- Review engagement metrics on Substack and Twitter
- Optimize posting times based on audience engagement

**Quarterly**:
- Add new articles to the rotation
- Update outdated information in existing articles
- Review and update target audience strategy

### Backup

Regularly backup your posting history:

```bash
# Backup posting history
cp scripts/posting_history.json scripts/posting_history.backup.json

# Backup session file
cp ~/.substack-session.json ~/.substack-session.backup.json
```

## Support and Troubleshooting

### Logs

Enable detailed logging:

```bash
# Create logs directory
mkdir -p logs

# Run with logging
node scripts/post_caribbean_tourism.mjs 2>&1 | tee logs/caribbean_$(date +%Y%m%d_%H%M%S).log
```

### Debug Mode

Run with maximum verbosity:

```bash
DEBUG=* HEADLESS=false node scripts/post_caribbean_tourism.mjs --dry-run
```

### Common Issues

1. **Browser crashes**: Increase timeout or add more wait time
2. **Session expires**: Re-login with `HEADLESS=false`
3. **Content not found**: Verify file path and format
4. **Rotation stuck**: Delete `posting_history.json` to reset

## Contributing

To improve this system:

1. Test changes in dry-run mode first
2. Document any new features or changes
3. Update this README with new usage patterns
4. Commit changes to the repository

## License

This system is part of the WUKR Wire project and follows the same license terms.

## Contact

For questions or issues:
- Check the logs first
- Review this README thoroughly
- Contact the development team

---

**Last Updated**: February 1, 2026  
**Version**: 1.0.0  
**Status**: Production Ready (after initial login setup)
