#!/usr/bin/env node

/**
 * Caribbean Tourism Content Syndication Script V6 - WUKR Wire Daily Dispatch
 * 
 * Automated content syndication to Substack and Twitter
 * Posts 2 articles at a time with intelligent rotation and duplicate tracking
 * 
 * Features:
 * - Rotation through 6 posts (Post 1-2 at 9 AM, Post 3-4 at 1 PM, Post 5-6 at 6 PM)
 * - Session persistence for autonomous operation
 * - JSON-based duplicate tracking
 * - Multi-platform syndication (Substack + Twitter)
 * - Error handling and recovery
 * - Twitter thread support for long content
 * 
 * Usage: 
 *   node scripts/post_caribbean_now_v6.mjs [--dry-run] [--setup-login] [--count=2]
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

    async markPostPublished(postNumber, platform, postUrl) {
        const post = this.data.posts.find(p => p.postNumber === postNumber);
        if (!post) {
            throw new Error(`Post ${postNumber} not found in database`);
        }

        post.lastPostedAt = new Date().toISOString();
        post.postCount += 1;
        
        if (platform === 'substack') {
            post.substackUrl = postUrl;
        } else if (platform === 'twitter') {
            post.twitterUrl = postUrl;
        }

        this.data.history.push({
            postNumber,
            platform,
            postUrl,
            postedAt: new Date().toISOString(),
            status: 'success'
        });

        await this.save();
        console.log(`✅ Marked Post ${postNumber} as published on ${platform}`);
    }

    async logError(postNumber, platform, errorMessage) {
        this.data.history.push({
            postNumber,
            platform,
            postUrl: null,
            postedAt: new Date().toISOString(),
            status: 'failed',
            errorMessage
        });
        await this.save();
        console.error(`❌ Logged error for Post ${postNumber} on ${platform}: ${errorMessage}`);
    }
}

// ============================================================================
// CONTENT PARSER - Extract posts from markdown file
// ============================================================================
class ContentParser {
    static async parseContent(filePath) {
        const content = await fs.readFile(filePath, 'utf-8');
        const posts = [];
        
        // Split by post sections
        const postSections = content.split(/## Post \d+:/);
        
        for (let i = 1; i < postSections.length; i++) {
            const section = postSections[i];
            const postNumber = i;
            
            // Extract title
            const titleMatch = section.match(/\*\*Title:\*\*\s*(.+)/);
            const title = titleMatch ? titleMatch[1].trim() : `Post ${postNumber}`;
            
            // Extract subtitle
            const subtitleMatch = section.match(/\*\*Subtitle:\*\*\s*(.+)/);
            const subtitle = subtitleMatch ? subtitleMatch[1].trim() : '';
            
            // Extract content (everything between **Content:** and **Sources:**)
            const contentMatch = section.match(/\*\*Content:\*\*\s*([\s\S]+?)\*\*Sources:\*\*/);
            const mainContent = contentMatch ? contentMatch[1].trim() : '';
            
            // Extract sources
            const sourcesMatch = section.match(/\*\*Sources:\*\*\s*(.+)/);
            const sources = sourcesMatch ? sourcesMatch[1].trim() : '';
            
            // Extract tags
            const tagsMatch = section.match(/\*\*Tags:\*\*\s*(.+)/);
            const tags = tagsMatch ? tagsMatch[1].trim() : '';
            
            posts.push({
                postNumber,
                title,
                subtitle,
                content: mainContent,
                sources,
                tags
            });
        }
        
        console.log(`📄 Parsed ${posts.length} posts from content file`);
        return posts;
    }
}

// ============================================================================
// TWITTER FORMATTER - Format content for Twitter (280 char limit)
// ============================================================================
class TwitterFormatter {
    static formatForTwitter(post) {
        const { title, subtitle, content, tags } = post;
        
        // Extract first key insight from content
        const paragraphs = content.split('\n\n').filter(p => p.trim() && !p.startsWith('**'));
        const firstInsight = paragraphs[0] || subtitle;
        
        // Create main tweet (under 280 chars)
        const hashtags = tags.split('#').filter(t => t.trim()).slice(0, 2).map(t => `#${t.trim().split(' ')[0]}`).join(' ');
        
        let tweet = `🌴 ${title}\n\n${firstInsight.substring(0, 150)}...\n\n${hashtags}`;
        
        // If over 280 chars, truncate
        if (tweet.length > 280) {
            tweet = `🌴 ${title}\n\n${firstInsight.substring(0, 120)}...\n\n${hashtags}`;
        }
        
        return {
            mainTweet: tweet,
            isThread: false
        };
    }
}

// ============================================================================
// SUBSTACK PUBLISHER - Post to Substack via Playwright
// ============================================================================
class SubstackPublisher {
    constructor(config) {
        this.config = config;
        this.browser = null;
        this.context = null;
        this.page = null;
    }

    async initialize() {
        console.log('🚀 Launching browser for Substack...');
        this.browser = await chromium.launch({ 
            headless: this.config.headless,
            timeout: this.config.timeout
        });

        // Load saved session if exists
        let storageState = undefined;
        try {
            const sessionData = await fs.readFile(this.config.substackSessionFile, 'utf-8');
            storageState = JSON.parse(sessionData);
            console.log('✅ Loaded Substack session from file');
        } catch (error) {
            console.log('⚠️  No saved Substack session found');
        }

        this.context = await this.browser.newContext({ storageState });
        this.page = await this.context.newPage();
    }

    async setupLogin() {
        console.log('🔐 Setting up Substack login...');
        await this.page.goto(this.config.substackUrl);
        
        console.log('\n⏸️  Please log in to Substack in the browser window...');
        console.log('Press Enter when you have completed login...');
        
        // Wait for user to press Enter
        await new Promise(resolve => {
            process.stdin.once('data', resolve);
        });

        // Save session
        const storageState = await this.context.storageState();
        await fs.writeFile(this.config.substackSessionFile, JSON.stringify(storageState, null, 2));
        console.log('✅ Substack session saved');
    }

    async publish(post) {
        console.log(`\n📝 Publishing to Substack: ${post.title}`);
        
        try {
            // Navigate to publish page
            await this.page.goto(`${this.config.substackUrl}/publish/home`, { 
                waitUntil: 'networkidle',
                timeout: this.config.timeout 
            });
            
            // Check if we're logged in
            const isLoggedIn = await this.page.locator('button:has-text("New post"), a:has-text("New post")').count() > 0;
            if (!isLoggedIn) {
                throw new Error('Not logged in to Substack. Run with --setup-login flag.');
            }

            // Click "New post" button
            await this.page.click('button:has-text("New post"), a:has-text("New post")');
            await this.page.waitForTimeout(2000);

            // Fill in title
            const titleField = this.page.locator('textarea[placeholder*="Title"], input[placeholder*="Title"]').first();
            await titleField.fill(post.title);
            await this.page.waitForTimeout(500);

            // Fill in subtitle if exists
            if (post.subtitle) {
                const subtitleField = this.page.locator('textarea[placeholder*="Subtitle"], input[placeholder*="Subtitle"]').first();
                if (await subtitleField.count() > 0) {
                    await subtitleField.fill(post.subtitle);
                    await this.page.waitForTimeout(500);
                }
            }

            // Fill in content
            const contentField = this.page.locator('[contenteditable="true"]').first();
            await contentField.click();
            await this.page.waitForTimeout(500);
            
            // Format content for Substack
            const formattedContent = `${post.content}\n\n---\n\n**Sources:** ${post.sources}\n\n${post.tags}`;
            await contentField.fill(formattedContent);
            await this.page.waitForTimeout(1000);

            // Click "Publish" or "Continue" button
            const publishButton = this.page.locator('button:has-text("Publish"), button:has-text("Continue")').first();
            await publishButton.click();
            await this.page.waitForTimeout(2000);

            // If there's a "Publish now" or "Send now" button, click it
            const confirmButton = this.page.locator('button:has-text("Publish now"), button:has-text("Send now")').first();
            if (await confirmButton.count() > 0) {
                await confirmButton.click();
                await this.page.waitForTimeout(3000);
            }

            // Get the published URL
            await this.page.waitForTimeout(3000);
            const currentUrl = this.page.url();
            
            console.log(`✅ Published to Substack: ${currentUrl}`);
            return currentUrl;

        } catch (error) {
            console.error(`❌ Error publishing to Substack: ${error.message}`);
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
// TWITTER PUBLISHER - Post to Twitter via Playwright
// ============================================================================
class TwitterPublisher {
    constructor(config) {
        this.config = config;
        this.browser = null;
        this.context = null;
        this.page = null;
    }

    async initialize() {
        console.log('🚀 Launching browser for Twitter...');
        this.browser = await chromium.launch({ 
            headless: this.config.headless,
            timeout: this.config.timeout
        });

        // Load saved session if exists
        let storageState = undefined;
        try {
            const sessionData = await fs.readFile(this.config.twitterSessionFile, 'utf-8');
            storageState = JSON.parse(sessionData);
            console.log('✅ Loaded Twitter session from file');
        } catch (error) {
            console.log('⚠️  No saved Twitter session found');
        }

        this.context = await this.browser.newContext({ storageState });
        this.page = await this.context.newPage();
    }

    async setupLogin() {
        console.log('🔐 Setting up Twitter login...');
        await this.page.goto(this.config.twitterUrl);
        
        console.log('\n⏸️  Please log in to Twitter in the browser window...');
        console.log('Press Enter when you have completed login...');
        
        // Wait for user to press Enter
        await new Promise(resolve => {
            process.stdin.once('data', resolve);
        });

        // Save session
        const storageState = await this.context.storageState();
        await fs.writeFile(this.config.twitterSessionFile, JSON.stringify(storageState, null, 2));
        console.log('✅ Twitter session saved');
    }

    async publish(post, substackUrl) {
        console.log(`\n🐦 Publishing to Twitter: ${post.title}`);
        
        try {
            // Navigate to Twitter home
            await this.page.goto(this.config.twitterUrl, { 
                waitUntil: 'networkidle',
                timeout: this.config.timeout 
            });
            
            // Format tweet
            const tweetData = TwitterFormatter.formatForTwitter(post);
            let tweetText = tweetData.mainTweet;
            
            // Add Substack link if available
            if (substackUrl) {
                tweetText += `\n\nRead more: ${substackUrl}`;
            }

            // Find tweet compose box
            const tweetBox = this.page.locator('[data-testid="tweetTextarea_0"]').first();
            await tweetBox.click();
            await this.page.waitForTimeout(500);
            await tweetBox.fill(tweetText);
            await this.page.waitForTimeout(1000);

            // Click tweet button
            const tweetButton = this.page.locator('[data-testid="tweetButtonInline"]').first();
            await tweetButton.click();
            await this.page.waitForTimeout(3000);

            // Get tweet URL (this is approximate - Twitter doesn't always expose the URL immediately)
            const tweetUrl = `${this.config.twitterUrl}/home`;
            
            console.log(`✅ Published to Twitter`);
            return tweetUrl;

        } catch (error) {
            console.error(`❌ Error publishing to Twitter: ${error.message}`);
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
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   WUKR Wire Caribbean Tourism Syndication V6              ║');
    console.log('║   Target: 320 Caribbean Tourism Businesses                ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const db = new PostingDatabase();
    await db.load();

    // Parse content from markdown file
    const allPosts = await ContentParser.parseContent(CONFIG.contentFile);
    
    // Get next posts to publish
    const postsToPublish = db.getNextPostsToPublish(CONFIG.postCount);
    console.log(`\n📋 Posts scheduled for publishing:`);
    postsToPublish.forEach(p => {
        console.log(`   - Post ${p.postNumber} (posted ${p.postCount} times, last: ${p.lastPostedAt || 'never'})`);
    });

    if (CONFIG.dryRun) {
        console.log('\n🔍 DRY RUN MODE - No actual posting will occur\n');
        for (const postMeta of postsToPublish) {
            const post = allPosts[postMeta.postNumber - 1];
            console.log(`\n--- Post ${post.postNumber}: ${post.title} ---`);
            console.log(`Subtitle: ${post.subtitle}`);
            console.log(`Content length: ${post.content.length} chars`);
            console.log(`Tags: ${post.tags}`);
        }
        return;
    }

    // Setup login if requested
    if (CONFIG.setupLogin) {
        const substackPublisher = new SubstackPublisher(CONFIG);
        await substackPublisher.initialize();
        await substackPublisher.setupLogin();
        await substackPublisher.close();

        const twitterPublisher = new TwitterPublisher(CONFIG);
        await twitterPublisher.initialize();
        await twitterPublisher.setupLogin();
        await twitterPublisher.close();

        console.log('\n✅ Login setup complete. Run without --setup-login to post content.');
        return;
    }

    // Publish posts
    for (const postMeta of postsToPublish) {
        const post = allPosts[postMeta.postNumber - 1];
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Publishing Post ${post.postNumber}: ${post.title}`);
        console.log('='.repeat(60));

        let substackUrl = null;
        let twitterUrl = null;

        // Publish to Substack
        try {
            const substackPublisher = new SubstackPublisher(CONFIG);
            await substackPublisher.initialize();
            substackUrl = await substackPublisher.publish(post);
            await db.markPostPublished(post.postNumber, 'substack', substackUrl);
            await substackPublisher.close();
        } catch (error) {
            console.error(`❌ Failed to publish Post ${post.postNumber} to Substack: ${error.message}`);
            await db.logError(post.postNumber, 'substack', error.message);
        }

        // Publish to Twitter
        try {
            const twitterPublisher = new TwitterPublisher(CONFIG);
            await twitterPublisher.initialize();
            twitterUrl = await twitterPublisher.publish(post, substackUrl);
            await db.markPostPublished(post.postNumber, 'twitter', twitterUrl);
            await twitterPublisher.close();
        } catch (error) {
            console.error(`❌ Failed to publish Post ${post.postNumber} to Twitter: ${error.message}`);
            await db.logError(post.postNumber, 'twitter', error.message);
        }

        console.log(`\n✅ Completed Post ${post.postNumber}`);
        if (substackUrl) console.log(`   Substack: ${substackUrl}`);
        if (twitterUrl) console.log(`   Twitter: ${twitterUrl}`);
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   Syndication Complete                                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
}

// Run the script
main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
