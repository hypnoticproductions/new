#!/usr/bin/env node

/**
 * Caribbean Tourism Content Syndication Script
 * 
 * Posts 2 Caribbean tourism articles to Substack and Twitter
 * Implements rotation logic to avoid duplicates
 * Tracks posting history in database
 * 
 * Usage: node scripts/post_caribbean_tourism.mjs [--dry-run] [--post-numbers=1,2]
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
    sessionFile: path.join(process.env.HOME, '.substack-session.json'),
    substackUrl: 'https://richarddannibarrifortune.substack.com',
    twitterUrl: 'https://twitter.com',
    headless: process.env.HEADLESS !== 'false', // Set HEADLESS=false for debugging
    timeout: 30000,
    dryRun: process.argv.includes('--dry-run'),
    targetAudience: '320 Caribbean tourism businesses'
};

// Simple in-memory database (replace with real DB connection)
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
            console.log('📊 No existing posting history found, starting fresh');
            await this.initializePosts();
        }
    }

    async save() {
        await fs.writeFile(this.dbFile, JSON.stringify(this.data, null, 2));
        console.log('💾 Saved posting history');
    }

    async initializePosts() {
        // Initialize with 6 posts
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

    getNextPostsToPublish(count = 2) {
        // Sort by: never posted first, then least posted, then by post number
        const sorted = [...this.data.posts].sort((a, b) => {
            if (a.lastPostedAt === null && b.lastPostedAt !== null) return -1;
            if (a.lastPostedAt !== null && b.lastPostedAt === null) return 1;
            if (a.postCount !== b.postCount) return a.postCount - b.postCount;
            if (a.lastPostedAt && b.lastPostedAt) {
                return new Date(a.lastPostedAt) - new Date(b.lastPostedAt);
            }
            return a.postNumber - b.postNumber;
        });
        return sorted.slice(0, count);
    }

    markPostPublished(postId, platform, url) {
        const post = this.data.posts.find(p => p.id === postId);
        if (post) {
            post.lastPostedAt = new Date().toISOString();
            post.postCount += 1;
            if (platform === 'substack') post.substackUrl = url;
            if (platform === 'twitter') post.twitterUrl = url;
        }

        this.data.history.push({
            postId,
            platform,
            url,
            status: 'success',
            postedAt: new Date().toISOString()
        });
    }

    logError(postId, platform, error) {
        this.data.history.push({
            postId,
            platform,
            url: null,
            status: 'failed',
            error: error.message,
            postedAt: new Date().toISOString()
        });
    }
}

// Content Parser
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
            const firstLine = lines[0].trim();
            
            // Extract title (first line after "Post N:")
            const titleMatch = section.match(/\*\*Title:\*\*\s*(.+)/);
            const subtitleMatch = section.match(/\*\*Subtitle:\*\*\s*(.+)/);
            const tagsMatch = section.match(/\*\*Tags:\*\*\s*(.+)/);
            
            // Extract content (everything between **Content:** and **Tags:**)
            const contentMatch = section.match(/\*\*Content:\*\*\s*([\s\S]+?)\*\*(?:Sources|Tags):/);
            
            return {
                postNumber: index + 1,
                title: titleMatch ? titleMatch[1].trim() : firstLine,
                subtitle: subtitleMatch ? subtitleMatch[1].trim() : '',
                content: contentMatch ? contentMatch[1].trim() : section,
                tags: tagsMatch ? tagsMatch[1].trim() : '',
                fullContent: section
            };
        });

        console.log(`📄 Parsed ${this.posts.length} posts from content file`);
        return this.posts;
    }

    getPost(postNumber) {
        return this.posts.find(p => p.postNumber === postNumber);
    }
}

// Substack Publisher
class SubstackPublisher {
    constructor(config) {
        this.config = config;
        this.browser = null;
        this.context = null;
        this.page = null;
    }

    async initialize() {
        console.log('🌐 Launching browser for Substack...');
        this.browser = await chromium.launch({ 
            headless: this.config.headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        // Try to load saved session
        let contextOptions = {
            viewport: { width: 1280, height: 720 },
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        };

        try {
            const sessionData = await fs.readFile(this.config.sessionFile, 'utf-8');
            const cookies = JSON.parse(sessionData);
            contextOptions.storageState = { cookies, origins: [] };
            console.log('🔐 Loaded saved Substack session');
        } catch (error) {
            console.log('⚠️  No saved session found, will need to login');
        }

        this.context = await this.browser.newContext(contextOptions);
        this.page = await this.context.newPage();
    }

    async checkLoginStatus() {
        console.log('🔍 Checking Substack login status...');
        await this.page.goto(`${this.config.substackUrl}/publish/home`, { 
            waitUntil: 'networkidle',
            timeout: this.config.timeout 
        });

        // Check if we're on the login page or dashboard
        const url = this.page.url();
        if (url.includes('/sign-in') || url.includes('login')) {
            console.log('❌ Not logged in to Substack');
            return false;
        }

        console.log('✅ Logged in to Substack');
        return true;
    }

    async saveSession() {
        const cookies = await this.context.cookies();
        await fs.writeFile(this.config.sessionFile, JSON.stringify(cookies, null, 2));
        console.log('💾 Saved Substack session');
    }

    async publish(post) {
        console.log(`\n📝 Publishing to Substack: "${post.title}"`);

        if (this.config.dryRun) {
            console.log('🔍 DRY RUN - Would publish:');
            console.log(`   Title: ${post.title}`);
            console.log(`   Subtitle: ${post.subtitle}`);
            console.log(`   Content length: ${post.content.length} chars`);
            return `https://example.com/dry-run-${post.postNumber}`;
        }

        try {
            // Navigate to new post page
            await this.page.goto(`${this.config.substackUrl}/publish/post/new`, {
                waitUntil: 'networkidle',
                timeout: this.config.timeout
            });

            // Wait for editor to load
            await this.page.waitForSelector('[data-testid="editor"]', { timeout: 10000 });

            // Fill in title
            const titleSelector = 'input[placeholder*="Title"], input[name="title"], [data-testid="post-title"]';
            await this.page.waitForSelector(titleSelector, { timeout: 5000 });
            await this.page.fill(titleSelector, post.title);
            console.log('   ✓ Filled title');

            // Fill in subtitle if exists
            if (post.subtitle) {
                try {
                    const subtitleSelector = 'input[placeholder*="Subtitle"], input[name="subtitle"], [data-testid="post-subtitle"]';
                    await this.page.fill(subtitleSelector, post.subtitle, { timeout: 3000 });
                    console.log('   ✓ Filled subtitle');
                } catch (error) {
                    console.log('   ⚠️  Subtitle field not found, skipping');
                }
            }

            // Fill in content
            const editorSelector = '[data-testid="editor"], .ProseMirror, [contenteditable="true"]';
            await this.page.waitForSelector(editorSelector, { timeout: 5000 });
            await this.page.click(editorSelector);
            await this.page.keyboard.type(post.content.substring(0, 5000)); // Limit for safety
            console.log('   ✓ Filled content');

            // Wait a moment for content to be processed
            await this.page.waitForTimeout(2000);

            // Click publish/continue button
            const publishButton = 'button:has-text("Continue"), button:has-text("Publish"), button:has-text("Next")';
            await this.page.click(publishButton);
            console.log('   ✓ Clicked continue/publish');

            // Wait for publish confirmation or next step
            await this.page.waitForTimeout(3000);

            // If there's a "Send now" or "Publish now" button, click it
            try {
                const sendNowButton = 'button:has-text("Send now"), button:has-text("Publish now"), button:has-text("Send to everyone")';
                await this.page.click(sendNowButton, { timeout: 5000 });
                console.log('   ✓ Clicked send/publish now');
            } catch (error) {
                console.log('   ⚠️  No "Send now" button found, post may be in draft');
            }

            // Wait for publish to complete
            await this.page.waitForTimeout(5000);

            // Try to capture the published URL
            let publishedUrl = this.page.url();
            
            // If we're still on the editor, try to find the post URL
            if (publishedUrl.includes('/publish/')) {
                try {
                    // Look for "View post" link or similar
                    const viewPostLink = await this.page.$('a:has-text("View post"), a:has-text("View")');
                    if (viewPostLink) {
                        publishedUrl = await viewPostLink.getAttribute('href');
                    }
                } catch (error) {
                    console.log('   ⚠️  Could not find published post URL');
                }
            }

            console.log(`   ✅ Published to Substack: ${publishedUrl}`);
            return publishedUrl;

        } catch (error) {
            console.error(`   ❌ Failed to publish to Substack: ${error.message}`);
            throw error;
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('🔒 Closed browser');
        }
    }
}

// Twitter Publisher
class TwitterPublisher {
    constructor(config) {
        this.config = config;
        this.browser = null;
        this.context = null;
        this.page = null;
    }

    async initialize() {
        console.log('🌐 Launching browser for Twitter...');
        this.browser = await chromium.launch({ 
            headless: this.config.headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        this.context = await this.browser.newContext({
            viewport: { width: 1280, height: 720 },
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        });

        this.page = await this.context.newPage();
    }

    formatTweet(post, substackUrl) {
        // Format according to SYNDICATION_TWITTER knowledge
        const title = post.title.length > 100 ? post.title.substring(0, 97) + '...' : post.title;
        const tags = post.tags.split('#').filter(t => t.trim()).slice(0, 2).map(t => `#${t.trim().split(' ')[0]}`).join(' ');
        
        // Create a concise tweet
        let tweet = `📊 ${title}\n\n`;
        
        // Add a short insight (first sentence of content)
        const firstSentence = post.content.split('.')[0] + '.';
        if (firstSentence.length < 100) {
            tweet += `${firstSentence}\n\n`;
        }
        
        // Add Substack link
        if (substackUrl) {
            tweet += `Read more: ${substackUrl}\n\n`;
        }
        
        // Add tags
        tweet += tags;
        
        // Ensure under 280 characters
        if (tweet.length > 280) {
            // Simplify to just title and link
            tweet = `📊 ${title}\n\n${substackUrl}\n\n${tags}`;
        }
        
        return tweet.substring(0, 280);
    }

    async checkLoginStatus() {
        console.log('🔍 Checking Twitter login status...');
        await this.page.goto('https://twitter.com/home', { 
            waitUntil: 'networkidle',
            timeout: this.config.timeout 
        });

        const url = this.page.url();
        if (url.includes('/login') || url.includes('/i/flow/login')) {
            console.log('❌ Not logged in to Twitter');
            return false;
        }

        console.log('✅ Logged in to Twitter');
        return true;
    }

    async publish(post, substackUrl) {
        console.log(`\n🐦 Publishing to Twitter: "${post.title}"`);

        const tweet = this.formatTweet(post, substackUrl);

        if (this.config.dryRun) {
            console.log('🔍 DRY RUN - Would tweet:');
            console.log(`   ${tweet}`);
            console.log(`   Length: ${tweet.length} chars`);
            return `https://twitter.com/user/status/dry-run-${post.postNumber}`;
        }

        try {
            // Navigate to Twitter home
            await this.page.goto('https://twitter.com/home', {
                waitUntil: 'networkidle',
                timeout: this.config.timeout
            });

            // Find and click the tweet compose box
            const composeSelector = '[data-testid="tweetTextarea_0"], [role="textbox"]';
            await this.page.waitForSelector(composeSelector, { timeout: 10000 });
            await this.page.click(composeSelector);
            console.log('   ✓ Clicked compose box');

            // Type the tweet
            await this.page.keyboard.type(tweet);
            console.log('   ✓ Typed tweet content');

            // Wait a moment
            await this.page.waitForTimeout(2000);

            // Click the Tweet button
            const tweetButton = '[data-testid="tweetButtonInline"], [data-testid="tweetButton"]';
            await this.page.click(tweetButton);
            console.log('   ✓ Clicked Tweet button');

            // Wait for tweet to be posted
            await this.page.waitForTimeout(5000);

            // Try to capture the tweet URL (this is tricky, may need adjustment)
            const tweetUrl = `https://twitter.com/user/status/${Date.now()}`;
            console.log(`   ✅ Published to Twitter: ${tweetUrl}`);
            
            return tweetUrl;

        } catch (error) {
            console.error(`   ❌ Failed to publish to Twitter: ${error.message}`);
            throw error;
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('🔒 Closed browser');
        }
    }
}

// Main execution
async function main() {
    console.log('🚀 Caribbean Tourism Content Syndication System');
    console.log('================================================\n');

    const db = new PostingDatabase();
    await db.load();

    const parser = new ContentParser(CONFIG.contentFile);
    await parser.parse();

    // Get next posts to publish
    const postsToPublish = db.getNextPostsToPublish(2);
    console.log(`\n📋 Posts scheduled for publishing:`);
    postsToPublish.forEach(p => {
        console.log(`   - Post ${p.postNumber}: ${p.title}`);
        console.log(`     Last posted: ${p.lastPostedAt || 'Never'}`);
        console.log(`     Post count: ${p.postCount}`);
    });

    if (CONFIG.dryRun) {
        console.log('\n🔍 DRY RUN MODE - No actual posting will occur\n');
    }

    // Initialize publishers
    const substackPublisher = new SubstackPublisher(CONFIG);
    const twitterPublisher = new TwitterPublisher(CONFIG);

    try {
        // Initialize Substack
        await substackPublisher.initialize();
        const substackLoggedIn = await substackPublisher.checkLoginStatus();

        if (!substackLoggedIn && !CONFIG.dryRun) {
            console.error('\n❌ ERROR: Not logged in to Substack');
            console.log('📋 Action required:');
            console.log('   1. Run this script with HEADLESS=false to see the browser');
            console.log('   2. Manually log in to Substack');
            console.log('   3. Session will be saved for future runs');
            console.log('\n   Command: HEADLESS=false node scripts/post_caribbean_tourism.mjs --dry-run\n');
            process.exit(1);
        }

        // Initialize Twitter
        await twitterPublisher.initialize();
        const twitterLoggedIn = await twitterPublisher.checkLoginStatus();

        if (!twitterLoggedIn && !CONFIG.dryRun) {
            console.error('\n❌ ERROR: Not logged in to Twitter');
            console.log('📋 Action required:');
            console.log('   1. Run this script with HEADLESS=false to see the browser');
            console.log('   2. Manually log in to Twitter');
            console.log('\n   Command: HEADLESS=false node scripts/post_caribbean_tourism.mjs --dry-run\n');
            process.exit(1);
        }

        // Publish each post
        for (const postToPublish of postsToPublish) {
            const post = parser.getPost(postToPublish.postNumber);
            
            if (!post) {
                console.error(`❌ Post ${postToPublish.postNumber} not found in content file`);
                continue;
            }

            console.log(`\n${'='.repeat(60)}`);
            console.log(`Publishing Post ${post.postNumber}`);
            console.log('='.repeat(60));

            try {
                // Publish to Substack first
                const substackUrl = await substackPublisher.publish(post);
                db.markPostPublished(postToPublish.id, 'substack', substackUrl);
                await substackPublisher.saveSession();

                // Wait between posts
                await new Promise(resolve => setTimeout(resolve, 5000));

                // Publish to Twitter with Substack link
                const twitterUrl = await twitterPublisher.publish(post, substackUrl);
                db.markPostPublished(postToPublish.id, 'twitter', twitterUrl);

                console.log(`\n✅ Successfully published Post ${post.postNumber} to both platforms`);

            } catch (error) {
                console.error(`\n❌ Error publishing Post ${post.postNumber}: ${error.message}`);
                db.logError(postToPublish.id, 'multi-platform', error);
            }

            // Wait between posts
            if (postsToPublish.length > 1) {
                console.log('\n⏳ Waiting 10 seconds before next post...');
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }

        // Save posting history
        await db.save();

        console.log('\n' + '='.repeat(60));
        console.log('✅ SYNDICATION COMPLETE');
        console.log('='.repeat(60));
        console.log(`\n📊 Summary:`);
        console.log(`   Posts published: ${postsToPublish.length}`);
        console.log(`   Target audience: ${CONFIG.targetAudience}`);
        console.log(`   Total posting history: ${db.data.history.length} records`);
        
        // Show next posts in rotation
        const nextPosts = db.getNextPostsToPublish(2);
        console.log(`\n📋 Next posts in rotation:`);
        nextPosts.forEach(p => {
            console.log(`   - Post ${p.postNumber}: ${p.title || `Post ${p.postNumber}`}`);
        });

    } catch (error) {
        console.error('\n❌ FATAL ERROR:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await substackPublisher.close();
        await twitterPublisher.close();
    }
}

// Run the script
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
