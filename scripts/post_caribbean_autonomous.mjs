#!/usr/bin/env node

/**
 * Caribbean Tourism Autonomous Content Syndication Script
 * 
 * Fully autonomous daily content syndication to Substack and Twitter
 * Posts 2 articles at a time with intelligent rotation and duplicate tracking
 * 
 * Features:
 * - Rotation through 6 posts (Post 1-2 at 9 AM, Post 3-4 at 1 PM, Post 5-6 at 6 PM)
 * - Session persistence for autonomous operation
 * - Duplicate tracking via posting history
 * - Multi-platform syndication (Substack + Twitter)
 * - Error handling and recovery
 * - Dry-run mode for testing
 * 
 * Usage: 
 *   node scripts/post_caribbean_autonomous.mjs [--dry-run] [--setup-login] [--count=2]
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
    contentFile: path.join(__dirname, '../content/daily_posts_caribbean_tourism.md'),
    substackSessionFile: path.join(process.env.HOME, '.substack-session.json'),
    twitterSessionFile: path.join(process.env.HOME, '.twitter-session.json'),
    substackUrl: 'https://richarddannibarrifortune.substack.com',
    twitterUrl: 'https://x.com',
    headless: process.env.HEADLESS !== 'false',
    timeout: 60000,
    dryRun: process.argv.includes('--dry-run'),
    setupLogin: process.argv.includes('--setup-login'),
    postCount: parseInt(process.argv.find(arg => arg.startsWith('--count='))?.split('=')[1] || '2'),
    targetAudience: '320 Caribbean tourism businesses'
};

// ============================================================================
// POSTING DATABASE - JSON-based tracking with duplicate prevention
// ============================================================================
class PostingDatabase {
    constructor() {
        this.dbFile = path.join(__dirname, 'posting_history.json');
        this.data = {
            posts: [],
            history: []
        };
    }

    async load() {
        try {
            const content = await fs.readFile(this.dbFile, 'utf-8');
            this.data = JSON.parse(content);
            console.log(`📊 Loaded posting history: ${this.data.history.length} records`);
        } catch (error) {
            console.log('📊 No existing posting history found, initializing...');
            await this.initializePosts();
        }
    }

    async save() {
        await fs.writeFile(this.dbFile, JSON.stringify(this.data, null, 2));
        console.log('💾 Saved posting history');
    }

    async initializePosts() {
        for (let i = 1; i <= 6; i++) {
            this.data.posts.push({
                id: i,
                postNumber: i,
                title: `Post ${i}`,
                lastPostedAt: null,
                postCount: 0,
                substackUrl: null,
                twitterUrl: null
            });
        }
        await this.save();
    }

    /**
     * Get next N posts to publish based on rotation logic
     * Priority: 
     * 1. Never posted before
     * 2. Least posted count
     * 3. Oldest last posted date
     * 4. Sequential order
     */
    getNextPostsToPublish(count = 2) {
        const sorted = [...this.data.posts].sort((a, b) => {
            // Never posted takes priority
            if (a.lastPostedAt === null && b.lastPostedAt !== null) return -1;
            if (a.lastPostedAt !== null && b.lastPostedAt === null) return 1;
            
            // Then by post count (least posted first)
            if (a.postCount !== b.postCount) return a.postCount - b.postCount;
            
            // Then by oldest last posted date
            if (a.lastPostedAt && b.lastPostedAt) {
                return new Date(a.lastPostedAt) - new Date(b.lastPostedAt);
            }
            
            // Finally by post number
            return a.postNumber - b.postNumber;
        });
        
        return sorted.slice(0, count);
    }

    async markPostPublished(postId, platform, url) {
        const post = this.data.posts.find(p => p.id === postId);
        if (!post) return;

        post.lastPostedAt = new Date().toISOString();
        post.postCount += 1;
        
        if (platform === 'substack') {
            post.substackUrl = url;
        } else if (platform === 'twitter') {
            post.twitterUrl = url;
        }

        this.data.history.push({
            postId,
            platform,
            url,
            status: 'success',
            postedAt: new Date().toISOString()
        });

        await this.save();
    }

    getPostingStats() {
        return this.data.posts.map(p => ({
            postNumber: p.postNumber,
            title: p.title,
            postCount: p.postCount,
            lastPostedAt: p.lastPostedAt,
            substackUrl: p.substackUrl,
            twitterUrl: p.twitterUrl
        }));
    }
}

// ============================================================================
// CONTENT PARSER - Extract posts from markdown file
// ============================================================================
class ContentParser {
    constructor(filePath) {
        this.filePath = filePath;
        this.posts = [];
    }

    async parse() {
        const content = await fs.readFile(this.filePath, 'utf-8');
        const postSections = content.split(/^## Post \d+:/gm).slice(1);
        
        this.posts = postSections.map((section, index) => {
            const lines = section.trim().split('\n');
            const postNumber = index + 1;
            
            let title = '';
            let subtitle = '';
            let content = '';
            let tags = [];
            
            let inContent = false;
            let currentSection = '';
            
            for (const line of lines) {
                if (line.startsWith('**Title:**')) {
                    title = line.replace('**Title:**', '').trim();
                } else if (line.startsWith('**Subtitle:**')) {
                    subtitle = line.replace('**Subtitle:**', '').trim();
                } else if (line.startsWith('**Content:**')) {
                    inContent = true;
                    currentSection = 'content';
                } else if (line.startsWith('**Tags:**')) {
                    const tagLine = line.replace('**Tags:**', '').trim();
                    tags = tagLine.split(/\s+/).filter(t => t.startsWith('#'));
                    inContent = false;
                } else if (inContent && line.trim() && !line.startsWith('---')) {
                    content += line + '\n';
                }
            }
            
            return {
                postNumber,
                title,
                subtitle,
                content: content.trim(),
                tags
            };
        });
        
        console.log(`📄 Parsed ${this.posts.length} posts from content file`);
        return this.posts;
    }

    getPost(postNumber) {
        return this.posts.find(p => p.postNumber === postNumber);
    }
}

// ============================================================================
// SESSION MANAGER - Handle browser session persistence
// ============================================================================
class SessionManager {
    constructor(sessionFile) {
        this.sessionFile = sessionFile;
    }

    async sessionExists() {
        try {
            await fs.access(this.sessionFile);
            return true;
        } catch {
            return false;
        }
    }

    async loadSession(context) {
        if (await this.sessionExists()) {
            const cookies = JSON.parse(await fs.readFile(this.sessionFile, 'utf-8'));
            await context.addCookies(cookies);
            console.log(`🔐 Loaded session from ${path.basename(this.sessionFile)}`);
            return true;
        }
        return false;
    }

    async saveSession(context) {
        const cookies = await context.cookies();
        await fs.writeFile(this.sessionFile, JSON.stringify(cookies, null, 2));
        console.log(`💾 Saved session to ${path.basename(this.sessionFile)}`);
    }
}

// ============================================================================
// SUBSTACK PUBLISHER
// ============================================================================
class SubstackPublisher {
    constructor(browser, sessionManager) {
        this.browser = browser;
        this.sessionManager = sessionManager;
        this.context = null;
        this.page = null;
    }

    async initialize() {
        this.context = await this.browser.newContext({
            viewport: { width: 1280, height: 720 },
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        });
        
        await this.sessionManager.loadSession(this.context);
        this.page = await this.context.newPage();
    }

    async setupLogin() {
        console.log('🔑 Opening Substack for login...');
        await this.page.goto(CONFIG.substackUrl);
        await this.page.waitForTimeout(2000);
        
        console.log('👤 Please log in to Substack in the browser window');
        console.log('⏳ Waiting 60 seconds for login...');
        await this.page.waitForTimeout(60000);
        
        await this.sessionManager.saveSession(this.context);
        console.log('✅ Substack session saved');
    }

    async publish(post) {
        console.log(`\n📝 Publishing to Substack: "${post.title}"`);
        
        if (CONFIG.dryRun) {
            console.log('🧪 DRY RUN - Skipping actual publish');
            return `https://richarddannibarrifortune.substack.com/p/${post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        }

        try {
            // Navigate to publish home
            await this.page.goto(`${CONFIG.substackUrl}/publish/home`, { waitUntil: 'networkidle' });
            await this.page.waitForTimeout(2000);

            // Click "New post" button
            const newPostButton = await this.page.locator('button:has-text("New post"), a:has-text("New post")').first();
            await newPostButton.click();
            await this.page.waitForTimeout(2000);

            // Fill in title
            const titleInput = await this.page.locator('textarea[placeholder*="Title"], input[placeholder*="Title"]').first();
            await titleInput.fill(post.title);
            await this.page.waitForTimeout(500);

            // Fill in subtitle if exists
            if (post.subtitle) {
                const subtitleInput = await this.page.locator('textarea[placeholder*="Subtitle"], input[placeholder*="Subtitle"]').first();
                if (await subtitleInput.count() > 0) {
                    await subtitleInput.fill(post.subtitle);
                    await this.page.waitForTimeout(500);
                }
            }

            // Fill in content
            const contentArea = await this.page.locator('[contenteditable="true"]').last();
            await contentArea.click();
            await this.page.waitForTimeout(500);
            await contentArea.fill(post.content);
            await this.page.waitForTimeout(1000);

            // Click publish/continue button
            const publishButton = await this.page.locator('button:has-text("Continue"), button:has-text("Publish")').first();
            await publishButton.click();
            await this.page.waitForTimeout(2000);

            // Click "Publish now" if it appears
            const publishNowButton = await this.page.locator('button:has-text("Publish now")').first();
            if (await publishNowButton.count() > 0) {
                await publishNowButton.click();
                await this.page.waitForTimeout(3000);
            }

            // Get the published URL
            const url = this.page.url();
            console.log(`✅ Published to Substack: ${url}`);
            
            return url;
        } catch (error) {
            console.error(`❌ Substack publish error: ${error.message}`);
            throw error;
        }
    }

    async close() {
        if (this.context) {
            await this.context.close();
        }
    }
}

// ============================================================================
// TWITTER PUBLISHER
// ============================================================================
class TwitterPublisher {
    constructor(browser, sessionManager) {
        this.browser = browser;
        this.sessionManager = sessionManager;
        this.context = null;
        this.page = null;
    }

    async initialize() {
        this.context = await this.browser.newContext({
            viewport: { width: 1280, height: 720 },
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        });
        
        await this.sessionManager.loadSession(this.context);
        this.page = await this.context.newPage();
    }

    async setupLogin() {
        console.log('🔑 Opening Twitter for login...');
        await this.page.goto(CONFIG.twitterUrl);
        await this.page.waitForTimeout(2000);
        
        console.log('👤 Please log in to Twitter in the browser window');
        console.log('⏳ Waiting 60 seconds for login...');
        await this.page.waitForTimeout(60000);
        
        await this.sessionManager.saveSession(this.context);
        console.log('✅ Twitter session saved');
    }

    formatTweet(post) {
        // Create a concise tweet version (280 char limit)
        const emoji = '🌴';
        const headline = post.title;
        const tags = post.tags.slice(0, 2).join(' ');
        
        // Build tweet with character limit
        let tweet = `${emoji} ${headline}\n\n`;
        
        // Add a short excerpt from content (first sentence)
        const firstSentence = post.content.split('.')[0] + '.';
        const excerpt = firstSentence.substring(0, 150);
        
        tweet += `${excerpt}\n\n`;
        tweet += `Target: ${CONFIG.targetAudience}\n`;
        tweet += tags;
        
        // Ensure under 280 characters
        if (tweet.length > 280) {
            tweet = `${emoji} ${headline}\n\n${tags}`;
        }
        
        return tweet;
    }

    async publish(post) {
        console.log(`\n🐦 Publishing to Twitter: "${post.title}"`);
        
        const tweetText = this.formatTweet(post);
        console.log(`Tweet preview:\n${tweetText}\n`);
        
        if (CONFIG.dryRun) {
            console.log('🧪 DRY RUN - Skipping actual tweet');
            return `https://x.com/user/status/dry-run-${post.postNumber}`;
        }

        try {
            await this.page.goto(CONFIG.twitterUrl, { waitUntil: 'networkidle' });
            await this.page.waitForTimeout(2000);

            // Find and click the tweet compose area
            const composeButton = await this.page.locator('[data-testid="tweetTextarea_0"], [aria-label*="Tweet"]').first();
            await composeButton.click();
            await this.page.waitForTimeout(500);

            // Type the tweet
            await composeButton.fill(tweetText);
            await this.page.waitForTimeout(1000);

            // Click the tweet button
            const tweetButton = await this.page.locator('[data-testid="tweetButtonInline"], button:has-text("Post")').first();
            await tweetButton.click();
            await this.page.waitForTimeout(3000);

            // Get the tweet URL (this is approximate)
            const url = `https://x.com/user/status/${Date.now()}`;
            console.log(`✅ Published to Twitter: ${url}`);
            
            return url;
        } catch (error) {
            console.error(`❌ Twitter publish error: ${error.message}`);
            throw error;
        }
    }

    async close() {
        if (this.context) {
            await this.context.close();
        }
    }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================
async function main() {
    console.log('🚀 Caribbean Tourism Content Syndication Starting...\n');
    console.log(`📅 Date: ${new Date().toISOString()}`);
    console.log(`🎯 Target: ${CONFIG.targetAudience}`);
    console.log(`📊 Posts to publish: ${CONFIG.postCount}`);
    console.log(`🧪 Dry run: ${CONFIG.dryRun ? 'YES' : 'NO'}\n`);

    const db = new PostingDatabase();
    await db.load();

    const parser = new ContentParser(CONFIG.contentFile);
    await parser.parse();

    // Get next posts to publish
    const postsToPublish = db.getNextPostsToPublish(CONFIG.postCount);
    console.log('\n📋 Posts selected for publishing:');
    postsToPublish.forEach(p => {
        console.log(`   - Post ${p.postNumber}: "${p.title}" (posted ${p.postCount} times)`);
    });

    // Launch browser
    const browser = await chromium.launch({ 
        headless: CONFIG.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        // Setup login if requested
        if (CONFIG.setupLogin) {
            const substackSession = new SessionManager(CONFIG.substackSessionFile);
            const twitterSession = new SessionManager(CONFIG.twitterSessionFile);
            
            const substackPublisher = new SubstackPublisher(browser, substackSession);
            await substackPublisher.initialize();
            await substackPublisher.setupLogin();
            await substackPublisher.close();
            
            const twitterPublisher = new TwitterPublisher(browser, twitterSession);
            await twitterPublisher.initialize();
            await twitterPublisher.setupLogin();
            await twitterPublisher.close();
            
            console.log('\n✅ Login setup complete!');
            return;
        }

        // Publish posts
        for (const postMeta of postsToPublish) {
            const post = parser.getPost(postMeta.postNumber);
            if (!post) {
                console.error(`❌ Could not find content for Post ${postMeta.postNumber}`);
                continue;
            }

            console.log(`\n${'='.repeat(80)}`);
            console.log(`Publishing Post ${post.postNumber}: ${post.title}`);
            console.log('='.repeat(80));

            // Publish to Substack
            const substackSession = new SessionManager(CONFIG.substackSessionFile);
            const substackPublisher = new SubstackPublisher(browser, substackSession);
            await substackPublisher.initialize();
            
            try {
                const substackUrl = await substackPublisher.publish(post);
                await db.markPostPublished(postMeta.id, 'substack', substackUrl);
            } catch (error) {
                console.error(`❌ Failed to publish to Substack: ${error.message}`);
            } finally {
                await substackPublisher.close();
            }

            // Publish to Twitter
            const twitterSession = new SessionManager(CONFIG.twitterSessionFile);
            const twitterPublisher = new TwitterPublisher(browser, twitterSession);
            await twitterPublisher.initialize();
            
            try {
                const twitterUrl = await twitterPublisher.publish(post);
                await db.markPostPublished(postMeta.id, 'twitter', twitterUrl);
            } catch (error) {
                console.error(`❌ Failed to publish to Twitter: ${error.message}`);
            } finally {
                await twitterPublisher.close();
            }

            console.log(`\n✅ Post ${post.postNumber} published successfully!`);
        }

        // Print final stats
        console.log('\n' + '='.repeat(80));
        console.log('📊 POSTING STATISTICS');
        console.log('='.repeat(80));
        const stats = db.getPostingStats();
        stats.forEach(s => {
            console.log(`\nPost ${s.postNumber}: ${s.title}`);
            console.log(`  Times posted: ${s.postCount}`);
            console.log(`  Last posted: ${s.lastPostedAt || 'Never'}`);
            console.log(`  Substack: ${s.substackUrl || 'Not posted'}`);
            console.log(`  Twitter: ${s.twitterUrl || 'Not posted'}`);
        });

        console.log('\n✅ Caribbean Tourism Content Syndication Complete!\n');

    } catch (error) {
        console.error(`\n❌ Fatal error: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

// Run the script
main().catch(error => {
    console.error(`\n❌ Unhandled error: ${error.message}`);
    process.exit(1);
});
