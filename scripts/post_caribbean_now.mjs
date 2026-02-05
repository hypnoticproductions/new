#!/usr/bin/env node

/**
 * Caribbean Tourism Content Syndication Script - Optimized Version
 * 
 * Posts 2 Caribbean tourism articles to Substack and Twitter
 * Uses intelligent rotation to avoid duplicates
 * Tracks posting history in JSON database
 * 
 * Usage: node scripts/post_caribbean_now.mjs [--dry-run] [--setup-login]
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
    targetAudience: '320 Caribbean tourism businesses',
    postsToPublish: 2
};

// ============================================================================
// DATABASE MANAGER
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
            console.log(`📊 Total posts: ${this.data.posts.length}`);
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

    getNextPostsToPublish(count = 2) {
        // Sort by:
        // 1. Posts never published (lastPostedAt is null)
        // 2. Posts published least often (postCount ascending)
        // 3. Posts published longest ago (lastPostedAt ascending)
        // 4. Post number (as tiebreaker)
        const sorted = [...this.data.posts].sort((a, b) => {
            // Never published posts come first
            if (a.lastPostedAt === null && b.lastPostedAt !== null) return -1;
            if (a.lastPostedAt !== null && b.lastPostedAt === null) return 1;
            
            // Then by post count (least published first)
            if (a.postCount !== b.postCount) return a.postCount - b.postCount;
            
            // Then by last posted date (oldest first)
            if (a.lastPostedAt && b.lastPostedAt) {
                return new Date(a.lastPostedAt) - new Date(b.lastPostedAt);
            }
            
            // Finally by post number
            return a.postNumber - b.postNumber;
        });
        
        const selected = sorted.slice(0, count);
        console.log('\n📋 Selected posts for publishing:');
        selected.forEach(post => {
            console.log(`   Post ${post.postNumber}: "${post.title}"`);
            console.log(`      Published ${post.postCount} times, last: ${post.lastPostedAt || 'never'}`);
        });
        
        return selected;
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

// ============================================================================
// CONTENT PARSER
// ============================================================================

class ContentParser {
    constructor(filePath) {
        this.filePath = filePath;
        this.posts = [];
    }

    async parse() {
        const content = await fs.readFile(this.filePath, 'utf-8');
        
        // Split by post sections
        const postSections = content.split(/^## Post \d+:/gm).slice(1);

        this.posts = postSections.map((section, index) => {
            const titleMatch = section.match(/\*\*Title:\*\*\s*(.+)/);
            const subtitleMatch = section.match(/\*\*Subtitle:\*\*\s*(.+)/);
            const tagsMatch = section.match(/\*\*Tags:\*\*\s*(.+)/);
            const contentMatch = section.match(/\*\*Content:\*\*\s*([\s\S]+?)(?:\*\*(?:Sources|Tags):|\n---|\n##|$)/);
            
            return {
                postNumber: index + 1,
                title: titleMatch ? titleMatch[1].trim() : `Post ${index + 1}`,
                subtitle: subtitleMatch ? subtitleMatch[1].trim() : '',
                content: contentMatch ? contentMatch[1].trim() : section.trim(),
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

// ============================================================================
// SUBSTACK PUBLISHER
// ============================================================================

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

        let contextOptions = {
            viewport: { width: 1280, height: 720 },
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        };

        try {
            const sessionData = await fs.readFile(this.config.substackSessionFile, 'utf-8');
            const cookies = JSON.parse(sessionData);
            contextOptions.storageState = { cookies, origins: [] };
            console.log('🔐 Loaded saved Substack session');
        } catch (error) {
            console.log('⚠️  No saved Substack session found - will need manual login');
        }

        this.context = await this.browser.newContext(contextOptions);
        this.page = await this.context.newPage();
    }

    async saveSession() {
        const cookies = await this.context.cookies();
        await fs.writeFile(this.config.substackSessionFile, JSON.stringify(cookies, null, 2));
        console.log('💾 Saved Substack session');
    }

    async setupLogin() {
        console.log('\n🔐 SUBSTACK LOGIN SETUP');
        console.log('Please log in to Substack in the browser that will open...');
        await this.page.goto(this.config.substackUrl, {
            waitUntil: 'domcontentloaded',
            timeout: this.config.timeout
        });
        
        console.log('⏳ Waiting 60 seconds for you to log in...');
        await this.page.waitForTimeout(60000);
        
        await this.saveSession();
        console.log('✅ Substack session saved!');
    }

    async publish(post) {
        console.log(`\n📝 Publishing to Substack: "${post.title}"`);

        if (this.config.dryRun) {
            console.log('🔍 DRY RUN - Would publish:');
            console.log(`   Title: ${post.title}`);
            console.log(`   Subtitle: ${post.subtitle}`);
            console.log(`   Content length: ${post.content.length} chars`);
            const slug = post.title.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
            return `${this.config.substackUrl}/p/${slug}`;
        }

        try {
            // Navigate to new post page
            console.log('   → Navigating to new post page...');
            await this.page.goto(`${this.config.substackUrl}/publish/post/new`, {
                waitUntil: 'domcontentloaded',
                timeout: this.config.timeout
            });

            await this.page.waitForTimeout(3000);

            // Fill in title
            console.log('   → Filling title...');
            const titleSelectors = [
                'input[placeholder*="Title"]',
                'input[name="title"]',
                '[data-testid="post-title"]',
                'textarea[placeholder*="Title"]'
            ];
            
            let titleFilled = false;
            for (const selector of titleSelectors) {
                try {
                    await this.page.fill(selector, post.title, { timeout: 5000 });
                    console.log('   ✓ Title filled');
                    titleFilled = true;
                    break;
                } catch (e) {
                    continue;
                }
            }

            if (!titleFilled) {
                throw new Error('Could not find title field');
            }

            // Fill in subtitle if exists
            if (post.subtitle) {
                console.log('   → Filling subtitle...');
                const subtitleSelectors = [
                    'input[placeholder*="Subtitle"]',
                    'input[name="subtitle"]',
                    '[data-testid="post-subtitle"]'
                ];
                
                for (const selector of subtitleSelectors) {
                    try {
                        await this.page.fill(selector, post.subtitle, { timeout: 3000 });
                        console.log('   ✓ Subtitle filled');
                        break;
                    } catch (e) {
                        continue;
                    }
                }
            }

            // Fill in content
            console.log('   → Filling content...');
            const editorSelectors = [
                '[data-testid="editor"]',
                '.ProseMirror',
                '[contenteditable="true"]',
                'div[role="textbox"]'
            ];
            
            let contentFilled = false;
            for (const selector of editorSelectors) {
                try {
                    await this.page.click(selector, { timeout: 5000 });
                    // Limit content to prevent timeout (first 8000 chars)
                    const contentToPost = post.content.substring(0, 8000);
                    await this.page.keyboard.type(contentToPost, { delay: 1 });
                    console.log('   ✓ Content filled');
                    contentFilled = true;
                    break;
                } catch (e) {
                    continue;
                }
            }

            if (!contentFilled) {
                throw new Error('Could not find content editor');
            }

            await this.page.waitForTimeout(2000);

            // Click publish/continue button
            console.log('   → Looking for publish button...');
            const publishSelectors = [
                'button:has-text("Continue")',
                'button:has-text("Publish")',
                '[data-testid="publish-button"]',
                'button[type="submit"]'
            ];
            
            let published = false;
            for (const selector of publishSelectors) {
                try {
                    await this.page.click(selector, { timeout: 5000 });
                    console.log('   ✓ Clicked publish button');
                    published = true;
                    break;
                } catch (e) {
                    continue;
                }
            }

            if (!published) {
                throw new Error('Could not find publish button');
            }

            // Wait for publish to complete
            await this.page.waitForTimeout(5000);

            // Capture the published URL
            const currentUrl = this.page.url();
            console.log(`   ✅ Published to: ${currentUrl}`);

            return currentUrl;

        } catch (error) {
            console.error(`   ❌ Error publishing to Substack: ${error.message}`);
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
// TWITTER PUBLISHER
// ============================================================================

class TwitterPublisher {
    constructor(config) {
        this.config = config;
        this.browser = null;
        this.context = null;
        this.page = null;
    }

    async initialize() {
        console.log('🐦 Launching browser for Twitter...');
        this.browser = await chromium.launch({ 
            headless: this.config.headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        let contextOptions = {
            viewport: { width: 1280, height: 720 },
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        };

        try {
            const sessionData = await fs.readFile(this.config.twitterSessionFile, 'utf-8');
            const cookies = JSON.parse(sessionData);
            contextOptions.storageState = { cookies, origins: [] };
            console.log('🔐 Loaded saved Twitter session');
        } catch (error) {
            console.log('⚠️  No saved Twitter session found - will need manual login');
        }

        this.context = await this.browser.newContext(contextOptions);
        this.page = await this.context.newPage();
    }

    async saveSession() {
        const cookies = await this.context.cookies();
        await fs.writeFile(this.config.twitterSessionFile, JSON.stringify(cookies, null, 2));
        console.log('💾 Saved Twitter session');
    }

    async setupLogin() {
        console.log('\n🔐 TWITTER LOGIN SETUP');
        console.log('Please log in to Twitter in the browser that will open...');
        await this.page.goto(this.config.twitterUrl, {
            waitUntil: 'domcontentloaded',
            timeout: this.config.timeout
        });
        
        console.log('⏳ Waiting 60 seconds for you to log in...');
        await this.page.waitForTimeout(60000);
        
        await this.saveSession();
        console.log('✅ Twitter session saved!');
    }

    formatTweet(post, substackUrl) {
        // Create a Twitter-friendly version (280 chars max)
        const title = post.title;
        const subtitle = post.subtitle;
        const tags = post.tags || '#CaribbeanTourism #Travel';
        
        // Build tweet
        let tweet = `🌴 ${title}\n\n`;
        
        if (subtitle && (tweet.length + subtitle.length + 10) < 240) {
            tweet += `${subtitle}\n\n`;
        }
        
        // Add link
        if (substackUrl) {
            tweet += `Read more: ${substackUrl}\n\n`;
        }
        
        // Add tags if space allows
        if (tweet.length + tags.length < 280) {
            tweet += tags;
        }
        
        // Truncate if needed
        if (tweet.length > 280) {
            tweet = tweet.substring(0, 277) + '...';
        }
        
        return tweet;
    }

    async publish(post, substackUrl = null) {
        console.log(`\n🐦 Publishing to Twitter: "${post.title}"`);

        const tweetText = this.formatTweet(post, substackUrl);
        console.log(`   Tweet text (${tweetText.length} chars):`);
        console.log(`   "${tweetText}"`);

        if (this.config.dryRun) {
            console.log('🔍 DRY RUN - Would publish tweet');
            return `https://x.com/user/status/dry-run-${post.postNumber}`;
        }

        try {
            // Navigate to Twitter
            console.log('   → Navigating to Twitter...');
            await this.page.goto(this.config.twitterUrl, {
                waitUntil: 'domcontentloaded',
                timeout: this.config.timeout
            });

            await this.page.waitForTimeout(3000);

            // Find tweet compose box
            console.log('   → Finding tweet compose box...');
            const composeSelectors = [
                '[data-testid="tweetTextarea_0"]',
                'div[role="textbox"][contenteditable="true"]',
                '[aria-label*="Tweet"]'
            ];
            
            let composeFilled = false;
            for (const selector of composeSelectors) {
                try {
                    await this.page.click(selector, { timeout: 5000 });
                    await this.page.keyboard.type(tweetText, { delay: 10 });
                    console.log('   ✓ Tweet text entered');
                    composeFilled = true;
                    break;
                } catch (e) {
                    continue;
                }
            }

            if (!composeFilled) {
                throw new Error('Could not find tweet compose box');
            }

            await this.page.waitForTimeout(2000);

            // Click tweet button
            console.log('   → Clicking tweet button...');
            const tweetButtonSelectors = [
                '[data-testid="tweetButtonInline"]',
                '[data-testid="tweetButton"]',
                'button:has-text("Post")',
                'button:has-text("Tweet")'
            ];
            
            let tweeted = false;
            for (const selector of tweetButtonSelectors) {
                try {
                    await this.page.click(selector, { timeout: 5000 });
                    console.log('   ✓ Clicked tweet button');
                    tweeted = true;
                    break;
                } catch (e) {
                    continue;
                }
            }

            if (!tweeted) {
                throw new Error('Could not find tweet button');
            }

            // Wait for tweet to post
            await this.page.waitForTimeout(5000);

            // Try to capture tweet URL
            const currentUrl = this.page.url();
            console.log(`   ✅ Published to Twitter: ${currentUrl}`);

            return currentUrl;

        } catch (error) {
            console.error(`   ❌ Error publishing to Twitter: ${error.message}`);
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
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  Caribbean Tourism Content Syndication                        ║');
    console.log('║  Target: 320 Caribbean tourism businesses                     ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    const startTime = new Date();
    console.log(`⏰ Started at: ${startTime.toISOString()}`);
    console.log(`🌍 Timezone: Atlantic Standard Time (AST)`);
    console.log(`📊 Posts to publish: ${CONFIG.postsToPublish}\n`);

    // Initialize database
    const db = new PostingDatabase();
    await db.load();

    // Parse content
    const parser = new ContentParser(CONFIG.contentFile);
    await parser.parse();

    // Get next posts to publish
    const postsToPublish = db.getNextPostsToPublish(CONFIG.postsToPublish);

    if (postsToPublish.length === 0) {
        console.log('⚠️  No posts available to publish');
        return;
    }

    // Setup login mode
    if (CONFIG.setupLogin) {
        console.log('\n🔐 SETUP LOGIN MODE\n');
        
        const substack = new SubstackPublisher(CONFIG);
        await substack.initialize();
        await substack.setupLogin();
        await substack.close();

        const twitter = new TwitterPublisher(CONFIG);
        await twitter.initialize();
        await twitter.setupLogin();
        await twitter.close();

        console.log('\n✅ Login setup complete!');
        return;
    }

    // Publish posts
    const results = [];

    for (const dbPost of postsToPublish) {
        const post = parser.getPost(dbPost.postNumber);
        if (!post) {
            console.log(`⚠️  Could not find content for Post ${dbPost.postNumber}`);
            continue;
        }

        console.log(`\n${'='.repeat(70)}`);
        console.log(`Publishing Post ${post.postNumber}: "${post.title}"`);
        console.log('='.repeat(70));

        let substackUrl = null;
        let twitterUrl = null;

        // Publish to Substack
        try {
            const substack = new SubstackPublisher(CONFIG);
            await substack.initialize();
            substackUrl = await substack.publish(post);
            db.markPostPublished(dbPost.id, 'substack', substackUrl);
            await substack.close();
        } catch (error) {
            console.error(`❌ Substack error: ${error.message}`);
            db.logError(dbPost.id, 'substack', error);
        }

        // Publish to Twitter
        try {
            const twitter = new TwitterPublisher(CONFIG);
            await twitter.initialize();
            twitterUrl = await twitter.publish(post, substackUrl);
            db.markPostPublished(dbPost.id, 'twitter', twitterUrl);
            await twitter.close();
        } catch (error) {
            console.error(`❌ Twitter error: ${error.message}`);
            db.logError(dbPost.id, 'twitter', error);
        }

        results.push({
            postNumber: post.postNumber,
            title: post.title,
            substackUrl,
            twitterUrl,
            success: !!(substackUrl || twitterUrl)
        });

        // Save after each post
        await db.save();
    }

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  PUBLISHING SUMMARY                                            ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    results.forEach(result => {
        console.log(`Post ${result.postNumber}: ${result.title}`);
        console.log(`   Substack: ${result.substackUrl || '❌ Failed'}`);
        console.log(`   Twitter:  ${result.twitterUrl || '❌ Failed'}`);
        console.log();
    });

    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;
    console.log(`⏱️  Total time: ${duration.toFixed(2)} seconds`);
    console.log(`✅ Completed at: ${endTime.toISOString()}\n`);
}

// Run
main().catch(error => {
    console.error('\n❌ FATAL ERROR:', error);
    process.exit(1);
});
