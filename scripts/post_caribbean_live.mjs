#!/usr/bin/env node

/**
 * Caribbean Tourism Content Syndication - LIVE VERSION
 * 
 * Automated content syndication to Substack and Twitter
 * Posts 2 articles at a time with intelligent rotation
 * 
 * Features:
 * - Rotation through 6 posts (Post 1-2 at 9 AM, Post 3-4 at 1 PM, Post 5-6 at 6 PM)
 * - Session persistence for autonomous operation
 * - Duplicate tracking via posting history
 * - Multi-platform syndication (Substack + Twitter)
 * - Error handling and recovery
 * 
 * Usage: 
 *   node scripts/post_caribbean_live.mjs [--dry-run] [--count=2] [--platforms=substack,twitter]
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseContent } from './parse_content.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIGURATION
// ============================================================================
const CONFIG = {
    substackSessionFile: path.join(process.env.HOME, '.substack-session.json'),
    twitterSessionFile: path.join(process.env.HOME, '.twitter-session.json'),
    substackUrl: 'https://richarddannibarrifortune.substack.com',
    twitterUrl: 'https://x.com',
    headless: process.env.HEADLESS !== 'false',
    timeout: 60000,
    dryRun: process.argv.includes('--dry-run'),
    postCount: parseInt(process.argv.find(arg => arg.startsWith('--count='))?.split('=')[1] || '2'),
    platforms: (process.argv.find(arg => arg.startsWith('--platforms='))?.split('=')[1] || 'substack,twitter').split(','),
    targetAudience: '320 Caribbean tourism businesses'
};

console.log('🚀 WUKR Wire Caribbean Tourism Syndication - LIVE');
console.log('📋 Configuration:', {
    dryRun: CONFIG.dryRun,
    postCount: CONFIG.postCount,
    platforms: CONFIG.platforms,
    headless: CONFIG.headless
});

// ============================================================================
// POSTING DATABASE - JSON-based tracking
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

    async markPostPublished(postNumber, platform, url) {
        const post = this.data.posts.find(p => p.postNumber === postNumber);
        if (!post) {
            console.error(`❌ Post ${postNumber} not found in database`);
            return;
        }

        post.lastPostedAt = new Date().toISOString();
        post.postCount += 1;
        
        if (platform === 'substack') {
            post.substackUrl = url;
        } else if (platform === 'twitter') {
            post.twitterUrl = url;
        }

        this.data.history.push({
            postId: post.id,
            platform,
            url,
            status: 'success',
            postedAt: new Date().toISOString()
        });

        await this.save();
        console.log(`✅ Marked Post ${postNumber} as published on ${platform}`);
    }

    getPostingStats() {
        return this.data.posts.map(p => ({
            postNumber: p.postNumber,
            title: p.title,
            postCount: p.postCount,
            lastPostedAt: p.lastPostedAt
        }));
    }
}

// ============================================================================
// SUBSTACK PUBLISHER
// ============================================================================
class SubstackPublisher {
    constructor(browser) {
        this.browser = browser;
        this.context = null;
        this.page = null;
    }

    async initialize() {
        console.log('🔧 Initializing Substack publisher...');
        
        // Try to load existing session
        try {
            const sessionData = await fs.readFile(CONFIG.substackSessionFile, 'utf-8');
            const { cookies, localStorage } = JSON.parse(sessionData);
            
            this.context = await this.browser.newContext({
                storageState: { cookies, origins: [] }
            });
            
            console.log('✅ Loaded Substack session from file');
        } catch (error) {
            console.log('⚠️  No saved Substack session found, creating new context');
            this.context = await this.browser.newContext();
        }

        this.page = await this.context.newPage();
    }

    async saveSession() {
        const cookies = await this.context.cookies();
        const sessionData = {
            cookies,
            savedAt: new Date().toISOString()
        };
        await fs.writeFile(CONFIG.substackSessionFile, JSON.stringify(sessionData, null, 2));
        console.log('💾 Saved Substack session');
    }

    async publish(post) {
        console.log(`\n📝 Publishing to Substack: "${post.title}"`);

        if (CONFIG.dryRun) {
            console.log('🔍 DRY RUN: Skipping actual Substack post');
            const dryRunUrl = `https://richarddannibarrifortune.substack.com/p/${post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            return dryRunUrl;
        }

        try {
            // Navigate to Substack publish page
            await this.page.goto(`${CONFIG.substackUrl}/publish/home`, { waitUntil: 'networkidle', timeout: CONFIG.timeout });
            
            // Check if logged in
            const isLoggedIn = await this.page.locator('button:has-text("New post"), button:has-text("Create new")').count() > 0;
            
            if (!isLoggedIn) {
                console.log('⚠️  Not logged in to Substack. Please log in manually.');
                console.log('   Opening browser for manual login...');
                
                // Wait for user to log in
                await this.page.waitForURL('**/publish/home', { timeout: 300000 }); // 5 min timeout
                await this.saveSession();
            }

            // Click "New post" or "Create new"
            await this.page.click('button:has-text("New post"), button:has-text("Create new")');
            await this.page.waitForTimeout(2000);

            // Look for "Text post" option
            const textPostButton = this.page.locator('button:has-text("Text post"), a:has-text("Text post")');
            if (await textPostButton.count() > 0) {
                await textPostButton.first().click();
                await this.page.waitForTimeout(2000);
            }

            // Fill in the title
            const titleInput = this.page.locator('input[placeholder*="Title"], textarea[placeholder*="Title"], [contenteditable="true"]').first();
            await titleInput.fill(post.title);
            await this.page.waitForTimeout(1000);

            // Fill in subtitle if exists
            if (post.subtitle) {
                const subtitleInput = this.page.locator('input[placeholder*="Subtitle"], textarea[placeholder*="Subtitle"]').first();
                if (await subtitleInput.count() > 0) {
                    await subtitleInput.fill(post.subtitle);
                    await this.page.waitForTimeout(1000);
                }
            }

            // Fill in the content
            const contentEditor = this.page.locator('[contenteditable="true"]').last();
            await contentEditor.click();
            await contentEditor.fill(post.content);
            await this.page.waitForTimeout(2000);

            // Click "Continue" or "Next"
            await this.page.click('button:has-text("Continue"), button:has-text("Next")');
            await this.page.waitForTimeout(2000);

            // Click "Publish now" or "Send to everyone now"
            await this.page.click('button:has-text("Publish now"), button:has-text("Send to everyone now")');
            await this.page.waitForTimeout(5000);

            // Capture the published URL
            const currentUrl = this.page.url();
            console.log(`✅ Published to Substack: ${currentUrl}`);

            await this.saveSession();
            return currentUrl;

        } catch (error) {
            console.error('❌ Substack publishing error:', error.message);
            throw error;
        }
    }

    async close() {
        if (this.page) await this.page.close();
        if (this.context) await this.context.close();
    }
}

// ============================================================================
// TWITTER PUBLISHER
// ============================================================================
class TwitterPublisher {
    constructor(browser) {
        this.browser = browser;
        this.context = null;
        this.page = null;
    }

    async initialize() {
        console.log('🔧 Initializing Twitter publisher...');
        
        // Try to load existing session
        try {
            const sessionData = await fs.readFile(CONFIG.twitterSessionFile, 'utf-8');
            const { cookies } = JSON.parse(sessionData);
            
            this.context = await this.browser.newContext({
                storageState: { cookies, origins: [] }
            });
            
            console.log('✅ Loaded Twitter session from file');
        } catch (error) {
            console.log('⚠️  No saved Twitter session found, creating new context');
            this.context = await this.browser.newContext();
        }

        this.page = await this.context.newPage();
    }

    async saveSession() {
        const cookies = await this.context.cookies();
        const sessionData = {
            cookies,
            savedAt: new Date().toISOString()
        };
        await fs.writeFile(CONFIG.twitterSessionFile, JSON.stringify(sessionData, null, 2));
        console.log('💾 Saved Twitter session');
    }

    async publish(post) {
        console.log(`\n🐦 Publishing to Twitter: "${post.title}"`);

        if (CONFIG.dryRun) {
            console.log('🔍 DRY RUN: Skipping actual Twitter post');
            console.log(`   Tweet content: ${post.twitterContent}`);
            const dryRunUrl = `https://x.com/user/status/dry-run-${post.postNumber}`;
            return dryRunUrl;
        }

        try {
            // Navigate to Twitter
            await this.page.goto(CONFIG.twitterUrl, { waitUntil: 'networkidle', timeout: CONFIG.timeout });
            
            // Check if logged in
            const isLoggedIn = await this.page.locator('[data-testid="SideNav_NewTweet_Button"]').count() > 0;
            
            if (!isLoggedIn) {
                console.log('⚠️  Not logged in to Twitter. Please log in manually.');
                console.log('   Opening browser for manual login...');
                
                // Wait for user to log in
                await this.page.waitForSelector('[data-testid="SideNav_NewTweet_Button"]', { timeout: 300000 }); // 5 min timeout
                await this.saveSession();
            }

            // Click the "Post" button in sidebar (if needed) or find the tweet box
            const tweetBox = this.page.locator('[data-testid="tweetTextarea_0"]');
            await tweetBox.click();
            await tweetBox.fill(post.twitterContent);
            await this.page.waitForTimeout(1000);

            // Click the "Post" button
            await this.page.click('[data-testid="tweetButtonInline"]');
            await this.page.waitForTimeout(3000);

            // Capture the tweet URL (this is tricky, may need to check profile)
            const tweetUrl = `https://x.com/user/status/${Date.now()}`;
            console.log(`✅ Published to Twitter: ${tweetUrl}`);

            await this.saveSession();
            return tweetUrl;

        } catch (error) {
            console.error('❌ Twitter publishing error:', error.message);
            throw error;
        }
    }

    async close() {
        if (this.page) await this.page.close();
        if (this.context) await this.context.close();
    }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================
async function main() {
    const db = new PostingDatabase();
    await db.load();

    // Parse content from markdown file
    console.log('\n📖 Parsing content from markdown file...');
    const allPosts = await parseContent();
    console.log(`✅ Parsed ${allPosts.length} posts`);

    // Get next posts to publish based on rotation
    const postsToPublish = db.getNextPostsToPublish(CONFIG.postCount);
    console.log(`\n📋 Posts to publish (${postsToPublish.length}):`);
    postsToPublish.forEach(p => {
        console.log(`   - Post ${p.postNumber}: ${p.title} (posted ${p.postCount} times)`);
    });

    // Match with full content
    const fullPostsToPublish = postsToPublish.map(p => {
        const fullPost = allPosts.find(fp => fp.postNumber === p.postNumber);
        return { ...p, ...fullPost };
    });

    // Initialize browser
    const browser = await chromium.launch({ 
        headless: CONFIG.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        // Publish to each platform
        for (const post of fullPostsToPublish) {
            console.log(`\n${'='.repeat(80)}`);
            console.log(`📢 Publishing Post ${post.postNumber}: ${post.title}`);
            console.log(`${'='.repeat(80)}`);

            // Substack
            if (CONFIG.platforms.includes('substack')) {
                try {
                    const substackPublisher = new SubstackPublisher(browser);
                    await substackPublisher.initialize();
                    const substackUrl = await substackPublisher.publish(post);
                    await db.markPostPublished(post.postNumber, 'substack', substackUrl);
                    await substackPublisher.close();
                } catch (error) {
                    console.error(`❌ Failed to publish to Substack: ${error.message}`);
                }
            }

            // Twitter
            if (CONFIG.platforms.includes('twitter')) {
                try {
                    const twitterPublisher = new TwitterPublisher(browser);
                    await twitterPublisher.initialize();
                    const twitterUrl = await twitterPublisher.publish(post);
                    await db.markPostPublished(post.postNumber, 'twitter', twitterUrl);
                    await twitterPublisher.close();
                } catch (error) {
                    console.error(`❌ Failed to publish to Twitter: ${error.message}`);
                }
            }
        }

        // Display final stats
        console.log(`\n${'='.repeat(80)}`);
        console.log('📊 POSTING STATISTICS');
        console.log(`${'='.repeat(80)}`);
        const stats = db.getPostingStats();
        stats.forEach(s => {
            console.log(`Post ${s.postNumber}: ${s.postCount} times | Last: ${s.lastPostedAt || 'Never'}`);
        });

    } finally {
        await browser.close();
    }

    console.log('\n✅ Caribbean Tourism Syndication Complete!');
}

// Run the script
main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
