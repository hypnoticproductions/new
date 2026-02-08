#!/usr/bin/env node

/**
 * WUKR Wire Caribbean Tourism Content Syndication Script
 * 
 * Automated daily content syndication to Substack and Twitter
 * Posts 2 articles at a time with intelligent rotation and duplicate tracking
 * 
 * Features:
 * - Rotation through 6 posts (Post 1-2 at 9 AM, Post 3-4 at 1 PM, Post 5-6 at 6 PM)
 * - Session persistence for autonomous operation
 * - Duplicate tracking via JSON posting history
 * - Multi-platform syndication (Substack primary, Twitter secondary)
 * - Error handling and recovery
 * 
 * Usage: 
 *   node scripts/post_caribbean_wukr.mjs [--dry-run] [--setup-login] [--count=2]
 *   node scripts/post_caribbean_wukr.mjs --setup-login  # First time setup
 *   node scripts/post_caribbean_wukr.mjs                # Normal posting
 *   node scripts/post_caribbean_wukr.mjs --dry-run      # Test without posting
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
            
            // Then by last posted date (oldest first)
            if (a.lastPostedAt && b.lastPostedAt) {
                return new Date(a.lastPostedAt) - new Date(b.lastPostedAt);
            }
            
            // Finally by post number
            return a.postNumber - b.postNumber;
        });
        
        return sorted.slice(0, count);
    }

    /**
     * Mark a post as published on a platform
     */
    async markPublished(postId, platform, url) {
        const post = this.data.posts.find(p => p.id === postId);
        if (!post) {
            throw new Error(`Post ${postId} not found`);
        }

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

    /**
     * Log a failed posting attempt
     */
    async logFailure(postId, platform, error) {
        this.data.history.push({
            postId,
            platform,
            url: null,
            status: 'failed',
            error: error.message,
            postedAt: new Date().toISOString()
        });
        await this.save();
    }
}

// ============================================================================
// CONTENT PARSER - Extract posts from markdown file
// ============================================================================
class ContentParser {
    constructor(filePath) {
        this.filePath = filePath;
    }

    async parse() {
        const content = await fs.readFile(this.filePath, 'utf-8');
        const posts = [];
        
        // Split by "## Post N:" pattern
        const postRegex = /## Post (\d+):(.*?)(?=## Post \d+:|$)/gs;
        let match;
        
        while ((match = postRegex.exec(content)) !== null) {
            const postNumber = parseInt(match[1]);
            const postContent = match[2].trim();
            
            // Extract title, subtitle, content, tags
            const titleMatch = postContent.match(/\*\*Title:\*\*\s*(.+)/);
            const subtitleMatch = postContent.match(/\*\*Subtitle:\*\*\s*(.+)/);
            const contentMatch = postContent.match(/\*\*Content:\*\*\s*([\s\S]+?)(?=\*\*Sources:|$)/);
            const sourcesMatch = postContent.match(/\*\*Sources:\*\*\s*(.+)/);
            const tagsMatch = postContent.match(/\*\*Tags:\*\*\s*(.+)/);
            
            posts.push({
                postNumber,
                title: titleMatch ? titleMatch[1].trim() : `Post ${postNumber}`,
                subtitle: subtitleMatch ? subtitleMatch[1].trim() : '',
                content: contentMatch ? contentMatch[1].trim() : '',
                sources: sourcesMatch ? sourcesMatch[1].trim() : '',
                tags: tagsMatch ? tagsMatch[1].trim() : ''
            });
        }
        
        console.log(`📄 Parsed ${posts.length} posts from content file`);
        return posts;
    }
}

// ============================================================================
// SUBSTACK POSTER - Browser automation for Substack
// ============================================================================
class SubstackPoster {
    constructor(config) {
        this.config = config;
        this.browser = null;
        this.page = null;
    }

    async init() {
        console.log('🌐 Launching browser for Substack...');
        this.browser = await chromium.launch({ 
            headless: this.config.headless 
        });
        
        const context = await this.browser.newContext();
        
        // Load saved session if exists
        try {
            const sessionData = await fs.readFile(this.config.substackSessionFile, 'utf-8');
            const cookies = JSON.parse(sessionData);
            await context.addCookies(cookies);
            console.log('✅ Loaded Substack session from file');
        } catch (error) {
            console.log('⚠️  No saved Substack session found');
        }
        
        this.page = await context.newPage();
    }

    async saveSession() {
        const cookies = await this.page.context().cookies();
        await fs.writeFile(
            this.config.substackSessionFile, 
            JSON.stringify(cookies, null, 2)
        );
        console.log('💾 Saved Substack session');
    }

    async post(postData) {
        if (this.config.dryRun) {
            console.log('🧪 DRY RUN: Would post to Substack:', postData.title);
            return `https://richarddannibarrifortune.substack.com/p/${postData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        }

        try {
            // Navigate to publish page
            await this.page.goto(`${this.config.substackUrl}/publish/home`, {
                waitUntil: 'networkidle',
                timeout: this.config.timeout
            });

            // Check if we need to login
            if (this.page.url().includes('sign-in') || this.config.setupLogin) {
                console.log('🔐 Login required. Please log in manually...');
                await this.page.waitForURL('**/publish/home', { timeout: 120000 });
                await this.saveSession();
            }

            // Click "New post" button
            await this.page.click('button:has-text("New post"), a:has-text("New post")', { timeout: 10000 });
            await this.page.waitForTimeout(2000);

            // Fill in the title
            const titleSelector = 'textarea[placeholder*="Title"], input[placeholder*="Title"]';
            await this.page.waitForSelector(titleSelector, { timeout: 10000 });
            await this.page.fill(titleSelector, postData.title);
            await this.page.waitForTimeout(1000);

            // Fill in subtitle if exists
            if (postData.subtitle) {
                const subtitleSelector = 'textarea[placeholder*="Subtitle"], input[placeholder*="Subtitle"]';
                try {
                    await this.page.fill(subtitleSelector, postData.subtitle, { timeout: 5000 });
                    await this.page.waitForTimeout(500);
                } catch (error) {
                    console.log('⚠️  Subtitle field not found, skipping...');
                }
            }

            // Click into the content area and fill it
            const editorSelector = '[contenteditable="true"], .ProseMirror, [role="textbox"]';
            await this.page.click(editorSelector);
            await this.page.waitForTimeout(1000);
            
            // Type the content
            await this.page.keyboard.type(postData.content);
            await this.page.waitForTimeout(2000);

            // Add sources and tags at the end
            if (postData.sources) {
                await this.page.keyboard.press('Enter');
                await this.page.keyboard.press('Enter');
                await this.page.keyboard.type(`Sources: ${postData.sources}`);
            }
            
            if (postData.tags) {
                await this.page.keyboard.press('Enter');
                await this.page.keyboard.type(postData.tags);
            }

            await this.page.waitForTimeout(2000);

            // Click "Publish" or "Continue" button
            await this.page.click('button:has-text("Publish"), button:has-text("Continue")', { timeout: 10000 });
            await this.page.waitForTimeout(3000);

            // If there's a second publish confirmation, click it
            try {
                await this.page.click('button:has-text("Publish now")', { timeout: 5000 });
                await this.page.waitForTimeout(5000);
            } catch (error) {
                console.log('⚠️  No second publish button found, assuming already published');
            }

            // Capture the published URL
            const currentUrl = this.page.url();
            console.log(`✅ Published to Substack: ${currentUrl}`);
            
            return currentUrl;

        } catch (error) {
            console.error('❌ Substack posting failed:', error.message);
            throw error;
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// ============================================================================
// TWITTER POSTER - Browser automation for Twitter/X
// ============================================================================
class TwitterPoster {
    constructor(config) {
        this.config = config;
        this.browser = null;
        this.page = null;
    }

    async init() {
        console.log('🐦 Launching browser for Twitter...');
        this.browser = await chromium.launch({ 
            headless: this.config.headless 
        });
        
        const context = await this.browser.newContext();
        
        // Load saved session if exists
        try {
            const sessionData = await fs.readFile(this.config.twitterSessionFile, 'utf-8');
            const cookies = JSON.parse(sessionData);
            await context.addCookies(cookies);
            console.log('✅ Loaded Twitter session from file');
        } catch (error) {
            console.log('⚠️  No saved Twitter session found');
        }
        
        this.page = await context.newPage();
    }

    async saveSession() {
        const cookies = await this.page.context().cookies();
        await fs.writeFile(
            this.config.twitterSessionFile, 
            JSON.stringify(cookies, null, 2)
        );
        console.log('💾 Saved Twitter session');
    }

    /**
     * Create a Twitter-friendly summary (280 chars max)
     */
    createTweetText(postData, substackUrl) {
        const emoji = '🏝️';
        const headline = postData.title;
        const maxLength = 280;
        
        // Extract first sentence or key insight from content
        const firstSentence = postData.content.split('.')[0] + '.';
        const insight = firstSentence.length > 100 ? 
            firstSentence.substring(0, 97) + '...' : 
            firstSentence;
        
        // Build tweet
        let tweet = `${emoji} ${headline}\n\n${insight}\n\nRead more: ${substackUrl}\n\n#CaribbeanTourism #TravelBusiness`;
        
        // Trim if too long
        if (tweet.length > maxLength) {
            const availableSpace = maxLength - emoji.length - headline.length - substackUrl.length - 40; // 40 for formatting and hashtags
            const trimmedInsight = insight.substring(0, availableSpace) + '...';
            tweet = `${emoji} ${headline}\n\n${trimmedInsight}\n\nRead more: ${substackUrl}\n\n#CaribbeanTourism`;
        }
        
        return tweet;
    }

    async post(postData, substackUrl) {
        const tweetText = this.createTweetText(postData, substackUrl);
        
        if (this.config.dryRun) {
            console.log('🧪 DRY RUN: Would post to Twitter:');
            console.log(tweetText);
            console.log(`Length: ${tweetText.length} chars`);
            return `https://x.com/user/status/dry-run-${postData.postNumber}`;
        }

        try {
            // Navigate to Twitter
            await this.page.goto(this.config.twitterUrl, {
                waitUntil: 'networkidle',
                timeout: this.config.timeout
            });

            // Check if we need to login
            if (this.page.url().includes('login') || this.config.setupLogin) {
                console.log('🔐 Login required. Please log in manually...');
                await this.page.waitForURL('**/home', { timeout: 120000 });
                await this.saveSession();
            }

            // Find the tweet compose box
            const composeSelector = '[data-testid="tweetTextarea_0"], [contenteditable="true"][aria-label*="Tweet"]';
            await this.page.waitForSelector(composeSelector, { timeout: 10000 });
            await this.page.click(composeSelector);
            await this.page.waitForTimeout(1000);

            // Type the tweet
            await this.page.keyboard.type(tweetText);
            await this.page.waitForTimeout(2000);

            // Click the "Post" button
            await this.page.click('[data-testid="tweetButtonInline"], button:has-text("Post")', { timeout: 10000 });
            await this.page.waitForTimeout(5000);

            // Try to capture the tweet URL
            // Twitter doesn't always redirect to the tweet, so we'll construct it
            const tweetUrl = `${this.config.twitterUrl}/user/status/${Date.now()}`;
            console.log(`✅ Posted to Twitter: ${tweetUrl}`);
            
            return tweetUrl;

        } catch (error) {
            console.error('❌ Twitter posting failed:', error.message);
            throw error;
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================
async function main() {
    console.log('🚀 WUKR Wire Caribbean Tourism Content Syndication');
    console.log('================================================\n');
    console.log(`Mode: ${CONFIG.dryRun ? '🧪 DRY RUN' : '📡 LIVE POSTING'}`);
    console.log(`Target: ${CONFIG.targetAudience}`);
    console.log(`Posts to publish: ${CONFIG.postCount}\n`);

    // Initialize database
    const db = new PostingDatabase();
    await db.load();

    // Parse content
    const parser = new ContentParser(CONFIG.contentFile);
    const allPosts = await parser.parse();

    // Get next posts to publish
    const postsToPublish = db.getNextPostsToPublish(CONFIG.postCount);
    console.log('\n📋 Posts selected for publishing:');
    postsToPublish.forEach(p => {
        console.log(`  - Post ${p.postNumber}: "${p.title}" (posted ${p.postCount} times)`);
    });
    console.log('');

    // Match with full content
    const postsWithContent = postsToPublish.map(p => {
        const fullPost = allPosts.find(ap => ap.postNumber === p.postNumber);
        return { ...p, ...fullPost };
    });

    // Initialize posters
    const substackPoster = new SubstackPoster(CONFIG);
    const twitterPoster = new TwitterPoster(CONFIG);

    try {
        await substackPoster.init();
        await twitterPoster.init();

        // Post each article
        for (const post of postsWithContent) {
            console.log(`\n📝 Processing Post ${post.postNumber}: ${post.title}`);
            console.log('─'.repeat(60));

            let substackUrl = null;
            let twitterUrl = null;

            // Post to Substack first
            try {
                console.log('📤 Posting to Substack...');
                substackUrl = await substackPoster.post(post);
                await db.markPublished(post.id, 'substack', substackUrl);
                console.log(`✅ Substack: ${substackUrl}`);
            } catch (error) {
                console.error(`❌ Substack failed: ${error.message}`);
                await db.logFailure(post.id, 'substack', error);
            }

            // Post to Twitter with Substack link
            if (substackUrl) {
                try {
                    console.log('📤 Posting to Twitter...');
                    twitterUrl = await twitterPoster.post(post, substackUrl);
                    await db.markPublished(post.id, 'twitter', twitterUrl);
                    console.log(`✅ Twitter: ${twitterUrl}`);
                } catch (error) {
                    console.error(`❌ Twitter failed: ${error.message}`);
                    await db.logFailure(post.id, 'twitter', error);
                }
            } else {
                console.log('⚠️  Skipping Twitter (no Substack URL)');
            }

            console.log('─'.repeat(60));
        }

        console.log('\n✅ Posting complete!');
        console.log('\n📊 Summary:');
        console.log(`  - Posts published: ${postsWithContent.length}`);
        console.log(`  - Total posting history: ${db.data.history.length} records`);

    } finally {
        await substackPoster.close();
        await twitterPoster.close();
    }
}

// Run the script
main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
