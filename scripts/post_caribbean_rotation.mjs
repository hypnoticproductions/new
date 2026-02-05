#!/usr/bin/env node

/**
 * Caribbean Tourism Content Syndication Script - WUKR Wire Daily Dispatch
 * 
 * Automated daily content syndication from Base 44 to Substack and Twitter
 * Posts 2 articles at a time with intelligent rotation and duplicate tracking
 * 
 * Features:
 * - Rotation through 6 posts (Post 1-2 at 9 AM, Post 3-4 at 1 PM, Post 5-6 at 6 PM)
 * - Session persistence for autonomous operation
 * - Duplicate tracking via posting history
 * - Multi-platform syndication (Substack primary, Twitter secondary)
 * - Error handling and recovery
 * 
 * Usage: 
 *   node scripts/post_caribbean_rotation.mjs [--dry-run] [--setup-login] [--count=2]
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
        
        const selected = sorted.slice(0, count);
        console.log(`\n🎯 Selected posts for this run:`);
        selected.forEach(post => {
            console.log(`   Post ${post.postNumber}: "${post.title}"`);
            console.log(`      Last posted: ${post.lastPostedAt || 'Never'}`);
            console.log(`      Post count: ${post.postCount}`);
        });
        
        return selected;
    }

    markPostPublished(postId, platform, url) {
        const post = this.data.posts.find(p => p.id === postId);
        if (post) {
            const now = new Date().toISOString();
            post.lastPostedAt = now;
            
            // Only increment count once per posting session
            const recentHistory = this.data.history.filter(
                h => h.postId === postId && 
                new Date(h.postedAt) > new Date(Date.now() - 60000) // Within last minute
            );
            if (recentHistory.length === 0) {
                post.postCount += 1;
            }
            
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

    getPostingStats() {
        const stats = {
            totalPosts: this.data.posts.length,
            totalPublications: this.data.history.filter(h => h.status === 'success').length,
            byPost: this.data.posts.map(p => ({
                postNumber: p.postNumber,
                title: p.title,
                postCount: p.postCount,
                lastPosted: p.lastPostedAt
            }))
        };
        return stats;
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
            const titleMatch = section.match(/\*\*Title:\*\*\s*(.+)/);
            const subtitleMatch = section.match(/\*\*Subtitle:\*\*\s*(.+)/);
            const tagsMatch = section.match(/\*\*Tags:\*\*\s*(.+)/);
            const sourcesMatch = section.match(/\*\*Sources:\*\*\s*(.+)/);
            const contentMatch = section.match(/\*\*Content:\*\*\s*([\s\S]+?)\*\*(?:Sources|Tags):/);
            
            return {
                postNumber: index + 1,
                title: titleMatch ? titleMatch[1].trim() : `Post ${index + 1}`,
                subtitle: subtitleMatch ? subtitleMatch[1].trim() : '',
                content: contentMatch ? contentMatch[1].trim() : section,
                tags: tagsMatch ? tagsMatch[1].trim() : '',
                sources: sourcesMatch ? sourcesMatch[1].trim() : '',
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
// SUBSTACK PUBLISHER - Browser automation for Substack
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
            console.log('⚠️  No saved Substack session found');
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
        console.log(`Opening: ${this.config.substackUrl}`);
        
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
                    console.log('   ✓ Filled title');
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
                        console.log('   ✓ Filled subtitle');
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
                    // Limit content to prevent timeout
                    const contentToPost = post.content.substring(0, 10000);
                    await this.page.keyboard.type(contentToPost, { delay: 0 });
                    console.log('   ✓ Filled content');
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

            // Click publish button
            console.log('   → Publishing...');
            const publishSelectors = [
                'button:has-text("Publish")',
                'button[aria-label*="Publish"]',
                '[data-testid="publish-button"]'
            ];
            
            for (const selector of publishSelectors) {
                try {
                    await this.page.click(selector, { timeout: 5000 });
                    console.log('   ✓ Clicked publish');
                    break;
                } catch (e) {
                    continue;
                }
            }

            // Wait for publish to complete and capture URL
            console.log('   → Waiting for publish to complete...');
            await this.page.waitForTimeout(5000);
            
            const currentUrl = this.page.url();
            console.log(`   ✅ Published! URL: ${currentUrl}`);
            
            return currentUrl;

        } catch (error) {
            console.error(`   ❌ Failed to publish to Substack: ${error.message}`);
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
// TWITTER PUBLISHER - Browser automation for Twitter/X
// ============================================================================
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
            console.log('⚠️  No saved Twitter session found');
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
        console.log(`Opening: ${this.config.twitterUrl}`);
        
        await this.page.goto(this.config.twitterUrl, {
            waitUntil: 'domcontentloaded',
            timeout: this.config.timeout
        });
        
        console.log('⏳ Waiting 60 seconds for you to log in...');
        await this.page.waitForTimeout(60000);
        
        await this.saveSession();
        console.log('✅ Twitter session saved!');
    }

    /**
     * Format post for Twitter (280 character limit)
     */
    formatTweet(post, substackUrl) {
        const maxLength = 280;
        
        // Build tweet components
        const headline = `🌴 ${post.title}`;
        const url = substackUrl || '';
        const hashtags = post.tags.split(' ').slice(0, 2).join(' '); // Max 2 hashtags
        const attribution = 'WUKR Wire Intelligence';
        
        // Calculate available space for insight
        const fixedContent = `${headline}\n\n${url}\n\n${attribution}\n${hashtags}`;
        const availableSpace = maxLength - fixedContent.length - 10; // Buffer
        
        // Extract short insight from subtitle or content
        let insight = post.subtitle || post.content.split('\n')[0];
        if (insight.length > availableSpace) {
            insight = insight.substring(0, availableSpace - 3) + '...';
        }
        
        const tweet = `${headline}\n\n${insight}\n\n${url}\n\n${attribution}\n${hashtags}`;
        
        return tweet.substring(0, maxLength);
    }

    async publish(post, substackUrl) {
        console.log(`\n🐦 Publishing to Twitter: "${post.title}"`);

        const tweet = this.formatTweet(post, substackUrl);
        
        if (this.config.dryRun) {
            console.log('🔍 DRY RUN - Would tweet:');
            console.log('---');
            console.log(tweet);
            console.log('---');
            console.log(`   Length: ${tweet.length} chars`);
            return `https://x.com/user/status/dry-run-${post.postNumber}`;
        }

        try {
            // Navigate to Twitter home
            console.log('   → Navigating to Twitter...');
            await this.page.goto(this.config.twitterUrl, {
                waitUntil: 'domcontentloaded',
                timeout: this.config.timeout
            });

            await this.page.waitForTimeout(3000);

            // Find tweet compose box
            console.log('   → Finding compose box...');
            const composeSelectors = [
                '[data-testid="tweetTextarea_0"]',
                '[aria-label*="Tweet text"]',
                '[role="textbox"]',
                '.public-DraftEditor-content'
            ];
            
            let composeFilled = false;
            for (const selector of composeSelectors) {
                try {
                    await this.page.click(selector, { timeout: 5000 });
                    await this.page.keyboard.type(tweet, { delay: 10 });
                    console.log('   ✓ Filled tweet');
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
            console.log('   → Posting tweet...');
            const tweetButtonSelectors = [
                '[data-testid="tweetButtonInline"]',
                '[data-testid="tweetButton"]',
                'button:has-text("Post")',
                'button:has-text("Tweet")'
            ];
            
            for (const selector of tweetButtonSelectors) {
                try {
                    await this.page.click(selector, { timeout: 5000 });
                    console.log('   ✓ Clicked post button');
                    break;
                } catch (e) {
                    continue;
                }
            }

            // Wait for tweet to post
            console.log('   → Waiting for tweet to post...');
            await this.page.waitForTimeout(5000);
            
            const currentUrl = this.page.url();
            console.log(`   ✅ Posted! URL: ${currentUrl}`);
            
            return currentUrl;

        } catch (error) {
            console.error(`   ❌ Failed to post to Twitter: ${error.message}`);
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
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║   WUKR WIRE DAILY DISPATCH - Caribbean Tourism Syndication    ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log(`\n📅 Execution Time: ${new Date().toLocaleString('en-US', { timeZone: 'America/Halifax' })} AST`);
    console.log(`🎯 Target Audience: ${CONFIG.targetAudience}`);
    console.log(`📊 Posts to publish: ${CONFIG.postCount}`);
    console.log(`🔍 Mode: ${CONFIG.dryRun ? 'DRY RUN' : 'LIVE'}\n`);

    const db = new PostingDatabase();
    const parser = new ContentParser(CONFIG.contentFile);
    
    try {
        // Load database and content
        await db.load();
        await parser.parse();

        // Setup login if requested
        if (CONFIG.setupLogin) {
            console.log('\n🔐 SETUP MODE: Configuring login sessions...\n');
            
            const substackPublisher = new SubstackPublisher(CONFIG);
            await substackPublisher.initialize();
            await substackPublisher.setupLogin();
            await substackPublisher.close();
            
            const twitterPublisher = new TwitterPublisher(CONFIG);
            await twitterPublisher.initialize();
            await twitterPublisher.setupLogin();
            await twitterPublisher.close();
            
            console.log('\n✅ Login setup complete! Run without --setup-login to post.\n');
            return;
        }

        // Get next posts to publish
        const postsToPublish = db.getNextPostsToPublish(CONFIG.postCount);
        
        if (postsToPublish.length === 0) {
            console.log('⚠️  No posts available to publish');
            return;
        }

        // Initialize publishers
        const substackPublisher = new SubstackPublisher(CONFIG);
        const twitterPublisher = new TwitterPublisher(CONFIG);
        
        await substackPublisher.initialize();
        await twitterPublisher.initialize();

        // Publish each post
        for (const dbPost of postsToPublish) {
            const content = parser.getPost(dbPost.postNumber);
            
            if (!content) {
                console.error(`❌ Could not find content for post ${dbPost.postNumber}`);
                continue;
            }

            let substackUrl = null;
            let twitterUrl = null;

            // Publish to Substack
            try {
                substackUrl = await substackPublisher.publish(content);
                db.markPostPublished(dbPost.id, 'substack', substackUrl);
                await db.save();
            } catch (error) {
                console.error(`❌ Substack publishing failed: ${error.message}`);
                db.logError(dbPost.id, 'substack', error);
                await db.save();
            }

            // Publish to Twitter
            try {
                twitterUrl = await twitterPublisher.publish(content, substackUrl);
                db.markPostPublished(dbPost.id, 'twitter', twitterUrl);
                await db.save();
            } catch (error) {
                console.error(`❌ Twitter publishing failed: ${error.message}`);
                db.logError(dbPost.id, 'twitter', error);
                await db.save();
            }

            console.log(`\n✅ Post ${dbPost.postNumber} syndication complete!`);
            if (substackUrl) console.log(`   Substack: ${substackUrl}`);
            if (twitterUrl) console.log(`   Twitter: ${twitterUrl}`);
        }

        // Save sessions for next run
        await substackPublisher.saveSession();
        await twitterPublisher.saveSession();

        // Cleanup
        await substackPublisher.close();
        await twitterPublisher.close();

        // Display stats
        console.log('\n📊 POSTING STATISTICS');
        console.log('═══════════════════════════════════════════════════════════════');
        const stats = db.getPostingStats();
        console.log(`Total posts: ${stats.totalPosts}`);
        console.log(`Total publications: ${stats.totalPublications}`);
        console.log('\nPost rotation status:');
        stats.byPost.forEach(p => {
            console.log(`  Post ${p.postNumber}: ${p.postCount} times (last: ${p.lastPosted || 'Never'})`);
        });
        console.log('═══════════════════════════════════════════════════════════════\n');

        console.log('✅ WUKR Wire Daily Dispatch complete!\n');

    } catch (error) {
        console.error(`\n❌ FATAL ERROR: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run main function
main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
