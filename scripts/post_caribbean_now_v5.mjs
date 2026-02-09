#!/usr/bin/env node

/**
 * Caribbean Tourism Content Syndication - WUKR Wire Daily Dispatch v5
 * 
 * Posts 2 Caribbean tourism articles to Substack and Twitter with intelligent rotation
 * 
 * Features:
 * - Rotation through 6 posts (Post 1-2 at 9 AM, Post 3-4 at 1 PM, Post 5-6 at 6 PM AST)
 * - Session persistence for autonomous operation
 * - Duplicate tracking via JSON database
 * - Multi-platform syndication (Substack + Twitter)
 * - Error handling and recovery
 * - Twitter thread support for long content
 * 
 * Usage: 
 *   node scripts/post_caribbean_now_v5.mjs [--dry-run] [--setup-login] [--count=2] [--platforms=substack,twitter]
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIGURATION
// ============================================================================
const CONFIG = {
    dbFile: path.join(__dirname, 'posting_history.json'),
    substackSessionFile: path.join(process.env.HOME, '.substack-session.json'),
    twitterSessionFile: path.join(process.env.HOME, '.twitter-session.json'),
    substackUrl: 'https://richarddannibarrifortune.substack.com',
    twitterUrl: 'https://x.com',
    headless: process.env.HEADLESS !== 'false',
    timeout: 60000,
    dryRun: process.argv.includes('--dry-run'),
    setupLogin: process.argv.includes('--setup-login'),
    postCount: parseInt(process.argv.find(arg => arg.startsWith('--count='))?.split('=')[1] || '2'),
    platforms: (process.argv.find(arg => arg.startsWith('--platforms='))?.split('=')[1] || 'substack,twitter').split(','),
    targetAudience: '320 Caribbean tourism businesses'
};

// ============================================================================
// POSTING DATABASE - JSON-based tracking
// ============================================================================
class PostingDatabase {
    constructor() {
        this.dbFile = CONFIG.dbFile;
        this.data = null;
    }

    async load() {
        try {
            const content = await fs.readFile(this.dbFile, 'utf-8');
            this.data = JSON.parse(content);
            console.log(`📊 Loaded posting database: ${this.data.posts.length} posts, ${this.data.history.length} history records`);
        } catch (error) {
            console.error('❌ Error loading database:', error.message);
            throw new Error('Database not initialized. Run initialize_posts_db.mjs first.');
        }
    }

    async save() {
        await fs.writeFile(this.dbFile, JSON.stringify(this.data, null, 2));
        console.log('💾 Saved posting database');
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
     * Mark post as published on a platform
     */
    async markPostPublished(postId, platform, postUrl) {
        const post = this.data.posts.find(p => p.id === postId);
        if (!post) {
            throw new Error(`Post ${postId} not found`);
        }
        
        // Update post metadata
        post.lastPostedAt = new Date().toISOString();
        post.postCount += 1;
        post.updatedAt = new Date().toISOString();
        
        // Update platform-specific URL
        const urlField = `${platform}Url`;
        post[urlField] = postUrl;
        
        // Add to history
        this.data.history.push({
            postId,
            postNumber: post.postNumber,
            platform,
            postUrl,
            status: 'success',
            postedAt: new Date().toISOString()
        });
        
        await this.save();
        console.log(`✅ Marked Post ${post.postNumber} as published on ${platform}`);
    }

    /**
     * Log failed posting attempt
     */
    async logFailure(postId, platform, errorMessage) {
        const post = this.data.posts.find(p => p.id === postId);
        
        this.data.history.push({
            postId,
            postNumber: post?.postNumber || null,
            platform,
            postUrl: null,
            status: 'failed',
            errorMessage,
            postedAt: new Date().toISOString()
        });
        
        await this.save();
        console.log(`❌ Logged failure for Post ${post?.postNumber || postId} on ${platform}`);
    }
}

// ============================================================================
// TWITTER FORMATTER - Convert long content to Twitter threads
// ============================================================================
class TwitterFormatter {
    /**
     * Format post for Twitter (thread if needed)
     */
    static formatPost(post) {
        const maxTweetLength = 280;
        
        // Create hook tweet
        const hookTweet = this.createHookTweet(post);
        
        // If content is short enough, return single tweet
        if (hookTweet.length <= maxTweetLength) {
            return [hookTweet];
        }
        
        // Otherwise create thread
        return this.createThread(post);
    }

    static createHookTweet(post) {
        const emoji = '🏝️';
        const hashtags = post.tags.slice(0, 2).join(' ');
        
        // Try to fit: emoji + title + hashtags
        let tweet = `${emoji} ${post.title}\n\n${hashtags}`;
        
        if (tweet.length <= 280) {
            return tweet;
        }
        
        // If too long, truncate title
        const maxTitleLength = 280 - emoji.length - hashtags.length - 5; // 5 for spacing and ellipsis
        const truncatedTitle = post.title.substring(0, maxTitleLength) + '...';
        return `${emoji} ${truncatedTitle}\n\n${hashtags}`;
    }

    static createThread(post) {
        const tweets = [];
        
        // Tweet 1: Hook
        tweets.push(this.createHookTweet(post));
        
        // Tweet 2: Subtitle/key insight
        if (post.subtitle) {
            tweets.push(`${post.subtitle}\n\nTarget: ${post.targetAudience}`);
        }
        
        // Tweet 3: Key takeaways (extract from content)
        const keyPoints = this.extractKeyPoints(post.content);
        if (keyPoints.length > 0) {
            tweets.push('Key insights:\n\n' + keyPoints.slice(0, 3).join('\n'));
        }
        
        // Tweet 4: Call to action
        tweets.push(`Full article: [Substack link]\n\n${post.tags.join(' ')}\n\nWUKR Wire Intelligence`);
        
        return tweets;
    }

    static extractKeyPoints(content) {
        // Extract bullet points or numbered items from content
        const bulletRegex = /^[•\-\*]\s*(.+)$/gm;
        const numberedRegex = /^\d+\.\s*(.+)$/gm;
        
        const bullets = [...content.matchAll(bulletRegex)].map(m => '• ' + m[1].trim());
        const numbered = [...content.matchAll(numberedRegex)].map(m => '• ' + m[1].trim());
        
        return [...bullets, ...numbered].slice(0, 5);
    }
}

// ============================================================================
// SUBSTACK POSTER
// ============================================================================
class SubstackPoster {
    constructor(browser) {
        this.browser = browser;
        this.sessionFile = CONFIG.substackSessionFile;
    }

    async loadSession() {
        try {
            const session = await fs.readFile(this.sessionFile, 'utf-8');
            return JSON.parse(session);
        } catch (error) {
            return null;
        }
    }

    async saveSession(context) {
        const cookies = await context.cookies();
        const storage = await context.storageState();
        await fs.writeFile(this.sessionFile, JSON.stringify({ cookies, storage }, null, 2));
        console.log('💾 Saved Substack session');
    }

    async post(postData) {
        console.log(`\n📝 Posting to Substack: "${postData.title}"`);
        
        const context = await this.browser.newContext();
        
        // Load session if exists
        const session = await this.loadSession();
        if (session?.storage) {
            await context.addCookies(session.cookies || []);
        }
        
        const page = await context.newPage();
        
        try {
            // Navigate to Substack publish page
            await page.goto(`${CONFIG.substackUrl}/publish/home`, { waitUntil: 'networkidle', timeout: CONFIG.timeout });
            
            // Check if logged in
            const isLoggedIn = await page.locator('button:has-text("New post"), a:has-text("New post")').count() > 0;
            
            if (!isLoggedIn) {
                console.log('⚠️  Not logged in to Substack. Please run with --setup-login first.');
                throw new Error('Not logged in to Substack');
            }
            
            // Click "New post"
            await page.click('button:has-text("New post"), a:has-text("New post")');
            await page.waitForTimeout(2000);
            
            // Fill in title
            const titleInput = page.locator('textarea[placeholder*="Title"], input[placeholder*="Title"]').first();
            await titleInput.fill(postData.title);
            await page.waitForTimeout(500);
            
            // Fill in subtitle if exists
            if (postData.subtitle) {
                const subtitleInput = page.locator('textarea[placeholder*="Subtitle"], input[placeholder*="Subtitle"]').first();
                if (await subtitleInput.count() > 0) {
                    await subtitleInput.fill(postData.subtitle);
                    await page.waitForTimeout(500);
                }
            }
            
            // Fill in content
            const contentEditor = page.locator('[contenteditable="true"]').last();
            await contentEditor.click();
            await page.waitForTimeout(500);
            
            // Type content (Substack uses a rich text editor)
            await contentEditor.fill(postData.content);
            await page.waitForTimeout(1000);
            
            if (CONFIG.dryRun) {
                console.log('🧪 DRY RUN: Would publish to Substack here');
                await page.screenshot({ path: '/tmp/substack-preview.png' });
                await context.close();
                return `${CONFIG.substackUrl}/p/dry-run-${Date.now()}`;
            }
            
            // Click "Continue" or "Publish"
            const publishButton = page.locator('button:has-text("Continue"), button:has-text("Publish")').first();
            await publishButton.click();
            await page.waitForTimeout(2000);
            
            // If there's a second confirmation, click it
            const confirmButton = page.locator('button:has-text("Publish now"), button:has-text("Send now")').first();
            if (await confirmButton.count() > 0) {
                await confirmButton.click();
                await page.waitForTimeout(3000);
            }
            
            // Wait for publish to complete and capture URL
            await page.waitForTimeout(5000);
            const publishedUrl = page.url();
            
            // Save session
            await this.saveSession(context);
            
            await context.close();
            
            console.log(`✅ Published to Substack: ${publishedUrl}`);
            return publishedUrl;
            
        } catch (error) {
            await page.screenshot({ path: '/tmp/substack-error.png' });
            await context.close();
            throw error;
        }
    }
}

// ============================================================================
// TWITTER POSTER
// ============================================================================
class TwitterPoster {
    constructor(browser) {
        this.browser = browser;
        this.sessionFile = CONFIG.twitterSessionFile;
    }

    async loadSession() {
        try {
            const session = await fs.readFile(this.sessionFile, 'utf-8');
            return JSON.parse(session);
        } catch (error) {
            return null;
        }
    }

    async saveSession(context) {
        const cookies = await context.cookies();
        const storage = await context.storageState();
        await fs.writeFile(this.sessionFile, JSON.stringify({ cookies, storage }, null, 2));
        console.log('💾 Saved Twitter session');
    }

    async post(postData, substackUrl = null) {
        console.log(`\n🐦 Posting to Twitter: "${postData.title}"`);
        
        const context = await this.browser.newContext();
        
        // Load session if exists
        const session = await this.loadSession();
        if (session?.storage) {
            await context.addCookies(session.cookies || []);
        }
        
        const page = await context.newPage();
        
        try {
            // Navigate to Twitter
            await page.goto(CONFIG.twitterUrl, { waitUntil: 'networkidle', timeout: CONFIG.timeout });
            
            // Check if logged in
            const isLoggedIn = await page.locator('[data-testid="SideNav_NewTweet_Button"]').count() > 0;
            
            if (!isLoggedIn) {
                console.log('⚠️  Not logged in to Twitter. Please run with --setup-login first.');
                throw new Error('Not logged in to Twitter');
            }
            
            // Format tweets
            let tweets = TwitterFormatter.formatPost(postData);
            
            // If we have a Substack URL, add it to the last tweet
            if (substackUrl) {
                tweets[tweets.length - 1] = tweets[tweets.length - 1].replace('[Substack link]', substackUrl);
            }
            
            console.log(`📊 Posting ${tweets.length} tweet(s)`);
            
            // Post first tweet
            const tweetUrl = await this.postSingleTweet(page, tweets[0]);
            
            // If thread, post replies
            if (tweets.length > 1) {
                for (let i = 1; i < tweets.length; i++) {
                    await page.waitForTimeout(2000);
                    await this.postReply(page, tweets[i]);
                }
            }
            
            // Save session
            await this.saveSession(context);
            
            await context.close();
            
            console.log(`✅ Published to Twitter: ${tweetUrl}`);
            return tweetUrl;
            
        } catch (error) {
            await page.screenshot({ path: '/tmp/twitter-error.png' });
            await context.close();
            throw error;
        }
    }

    async postSingleTweet(page, text) {
        // Click "Post" button to open composer
        await page.click('[data-testid="SideNav_NewTweet_Button"]');
        await page.waitForTimeout(1000);
        
        // Type tweet
        const tweetBox = page.locator('[data-testid="tweetTextarea_0"]');
        await tweetBox.fill(text);
        await page.waitForTimeout(500);
        
        if (CONFIG.dryRun) {
            console.log('🧪 DRY RUN: Would post tweet here');
            console.log(`   Content: ${text.substring(0, 100)}...`);
            await page.keyboard.press('Escape');
            return `https://x.com/dry-run/${Date.now()}`;
        }
        
        // Click "Post" button
        await page.click('[data-testid="tweetButtonInline"]');
        await page.waitForTimeout(3000);
        
        // Get tweet URL from the page
        const tweetUrl = page.url();
        return tweetUrl;
    }

    async postReply(page, text) {
        // Click reply button on the last tweet
        await page.click('[data-testid="reply"]');
        await page.waitForTimeout(1000);
        
        // Type reply
        const replyBox = page.locator('[data-testid="tweetTextarea_0"]');
        await replyBox.fill(text);
        await page.waitForTimeout(500);
        
        if (CONFIG.dryRun) {
            console.log('🧪 DRY RUN: Would post reply here');
            console.log(`   Content: ${text.substring(0, 100)}...`);
            await page.keyboard.press('Escape');
            return;
        }
        
        // Click "Reply" button
        await page.click('[data-testid="tweetButtonInline"]');
        await page.waitForTimeout(2000);
    }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================
async function main() {
    console.log('🚀 Caribbean Tourism Content Syndication - WUKR Wire Daily Dispatch v5');
    console.log(`📅 ${new Date().toLocaleString('en-US', { timeZone: 'America/Puerto_Rico', timeZoneName: 'short' })}`);
    console.log(`🎯 Target: ${CONFIG.targetAudience}`);
    console.log(`📊 Platforms: ${CONFIG.platforms.join(', ')}`);
    console.log(`📝 Posts to publish: ${CONFIG.postCount}`);
    
    if (CONFIG.dryRun) {
        console.log('🧪 DRY RUN MODE - No actual posting will occur');
    }
    
    // Load database
    const db = new PostingDatabase();
    await db.load();
    
    // Get next posts to publish
    const postsToPublish = db.getNextPostsToPublish(CONFIG.postCount);
    
    if (postsToPublish.length === 0) {
        console.log('✅ No posts to publish');
        return;
    }
    
    console.log(`\n📋 Posts to publish:`);
    postsToPublish.forEach((post, i) => {
        console.log(`   ${i + 1}. Post ${post.postNumber}: ${post.title}`);
        console.log(`      Last posted: ${post.lastPostedAt || 'Never'} (${post.postCount} times)`);
    });
    
    // Launch browser
    const browser = await chromium.launch({ headless: CONFIG.headless });
    
    // Setup login mode
    if (CONFIG.setupLogin) {
        console.log('\n🔐 SETUP LOGIN MODE');
        console.log('Please log in to the platforms manually in the browser windows that open.');
        console.log('Sessions will be saved for future autonomous operation.\n');
        
        if (CONFIG.platforms.includes('substack')) {
            const context = await browser.newContext();
            const page = await context.newPage();
            await page.goto(`${CONFIG.substackUrl}/publish/home`);
            console.log('📝 Substack login page opened. Please log in...');
            await page.waitForTimeout(60000); // Wait 60 seconds for manual login
            const substackPoster = new SubstackPoster(browser);
            await substackPoster.saveSession(context);
            await context.close();
        }
        
        if (CONFIG.platforms.includes('twitter')) {
            const context = await browser.newContext();
            const page = await context.newPage();
            await page.goto(CONFIG.twitterUrl);
            console.log('🐦 Twitter login page opened. Please log in...');
            await page.waitForTimeout(60000); // Wait 60 seconds for manual login
            const twitterPoster = new TwitterPoster(browser);
            await twitterPoster.saveSession(context);
            await context.close();
        }
        
        await browser.close();
        console.log('✅ Sessions saved. You can now run the script without --setup-login');
        return;
    }
    
    // Post to platforms
    const results = [];
    
    for (const post of postsToPublish) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📤 Publishing Post ${post.postNumber}: ${post.title}`);
        console.log(`${'='.repeat(80)}`);
        
        let substackUrl = null;
        let twitterUrl = null;
        
        // Post to Substack
        if (CONFIG.platforms.includes('substack')) {
            try {
                const substackPoster = new SubstackPoster(browser);
                substackUrl = await substackPoster.post(post);
                await db.markPostPublished(post.id, 'substack', substackUrl);
            } catch (error) {
                console.error(`❌ Failed to post to Substack:`, error.message);
                await db.logFailure(post.id, 'substack', error.message);
            }
        }
        
        // Post to Twitter
        if (CONFIG.platforms.includes('twitter')) {
            try {
                const twitterPoster = new TwitterPoster(browser);
                twitterUrl = await twitterPoster.post(post, substackUrl);
                await db.markPostPublished(post.id, 'twitter', twitterUrl);
            } catch (error) {
                console.error(`❌ Failed to post to Twitter:`, error.message);
                await db.logFailure(post.id, 'twitter', error.message);
            }
        }
        
        results.push({
            post: post.postNumber,
            title: post.title,
            substackUrl,
            twitterUrl
        });
    }
    
    await browser.close();
    
    // Summary
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 POSTING SUMMARY');
    console.log(`${'='.repeat(80)}`);
    
    results.forEach(result => {
        console.log(`\nPost ${result.post}: ${result.title}`);
        if (result.substackUrl) console.log(`   Substack: ${result.substackUrl}`);
        if (result.twitterUrl) console.log(`   Twitter: ${result.twitterUrl}`);
    });
    
    console.log(`\n✅ Syndication complete!`);
}

// Run
main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
