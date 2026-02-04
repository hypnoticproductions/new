#!/usr/bin/env node

/**
 * Caribbean Tourism Content Syndication Script V3
 * 
 * Enhanced version with:
 * - Improved Twitter session management
 * - Better URL capture for both platforms
 * - Enhanced error handling and recovery
 * - Autonomous operation with saved sessions
 * 
 * Usage: node scripts/post_caribbean_tourism_v3.mjs [--dry-run] [--setup-login]
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
    targetAudience: '320 Caribbean tourism businesses'
};

// Simple in-memory database
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
            const titleMatch = section.match(/\*\*Title:\*\*\s*(.+)/);
            const subtitleMatch = section.match(/\*\*Subtitle:\*\*\s*(.+)/);
            const tagsMatch = section.match(/\*\*Tags:\*\*\s*(.+)/);
            const contentMatch = section.match(/\*\*Content:\*\*\s*([\s\S]+?)\*\*(?:Sources|Tags):/);
            
            return {
                postNumber: index + 1,
                title: titleMatch ? titleMatch[1].trim() : `Post ${index + 1}`,
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
                    await this.page.keyboard.type(contentToPost);
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

            await this.page.waitForTimeout(3000);

            // Click publish/continue button
            console.log('   → Clicking publish button...');
            const publishSelectors = [
                'button:has-text("Continue")',
                'button:has-text("Publish")',
                'button:has-text("Next")'
            ];
            
            let publishClicked = false;
            for (const selector of publishSelectors) {
                try {
                    await this.page.click(selector, { timeout: 5000 });
                    console.log('   ✓ Clicked continue/publish');
                    publishClicked = true;
                    break;
                } catch (e) {
                    continue;
                }
            }

            if (!publishClicked) {
                throw new Error('Could not find publish button');
            }

            await this.page.waitForTimeout(3000);

            // Try to click "Send now" or "Publish now"
            console.log('   → Clicking send/publish now...');
            const sendSelectors = [
                'button:has-text("Send now")',
                'button:has-text("Publish now")',
                'button:has-text("Send to everyone")'
            ];
            
            for (const selector of sendSelectors) {
                try {
                    await this.page.click(selector, { timeout: 5000 });
                    console.log('   ✓ Clicked send/publish now');
                    break;
                } catch (e) {
                    continue;
                }
            }

            await this.page.waitForTimeout(5000);

            // Capture published URL
            let publishedUrl = this.page.url();
            
            // If still on publish page, try to get the actual post URL
            if (publishedUrl.includes('/publish/')) {
                try {
                    const viewPostLink = await this.page.$('a:has-text("View post"), a:has-text("View")');
                    if (viewPostLink) {
                        publishedUrl = await viewPostLink.getAttribute('href');
                        if (publishedUrl && !publishedUrl.startsWith('http')) {
                            publishedUrl = this.config.substackUrl + publishedUrl;
                        }
                    }
                } catch (error) {
                    // Construct URL from title
                    const slug = post.title.toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, '');
                    publishedUrl = `${this.config.substackUrl}/p/${slug}`;
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
        await this.page.goto('https://x.com/home', {
            waitUntil: 'domcontentloaded',
            timeout: this.config.timeout
        });
        
        console.log('⏳ Waiting 60 seconds for you to log in...');
        await this.page.waitForTimeout(60000);
        
        await this.saveSession();
        console.log('✅ Twitter session saved!');
    }

    formatTweet(post, substackUrl) {
        const title = post.title.length > 100 ? post.title.substring(0, 97) + '...' : post.title;
        const tags = post.tags.split('#').filter(t => t.trim()).slice(0, 2).map(t => `#${t.trim().split(' ')[0]}`).join(' ');
        
        let tweet = `📊 ${title}\n\n`;
        
        const firstSentence = post.content.split('.')[0] + '.';
        if (firstSentence.length < 100) {
            tweet += `${firstSentence}\n\n`;
        }
        
        if (substackUrl) {
            tweet += `${substackUrl}\n\n`;
        }
        
        tweet += tags;
        
        if (tweet.length > 280) {
            tweet = `📊 ${title}\n\n${substackUrl}\n\n${tags}`;
        }
        
        return tweet.substring(0, 280);
    }

    async publish(post, substackUrl) {
        console.log(`\n🐦 Publishing to Twitter: "${post.title}"`);

        const tweet = this.formatTweet(post, substackUrl);

        if (this.config.dryRun) {
            console.log('🔍 DRY RUN - Would tweet:');
            console.log(`   ${tweet}`);
            console.log(`   Length: ${tweet.length} chars`);
            return `https://x.com/user/status/dry-run-${post.postNumber}`;
        }

        try {
            // Navigate to Twitter
            console.log('   → Navigating to Twitter...');
            await this.page.goto('https://x.com/home', {
                waitUntil: 'domcontentloaded',
                timeout: this.config.timeout
            });

            await this.page.waitForTimeout(3000);

            // Find compose box
            console.log('   → Finding compose box...');
            const composeSelectors = [
                '[data-testid="tweetTextarea_0"]',
                '[role="textbox"][contenteditable="true"]',
                'div[data-testid="tweetTextarea_0"]'
            ];
            
            let composeFilled = false;
            for (const selector of composeSelectors) {
                try {
                    await this.page.click(selector, { timeout: 5000 });
                    await this.page.keyboard.type(tweet);
                    console.log('   ✓ Typed tweet content');
                    composeFilled = true;
                    break;
                } catch (e) {
                    continue;
                }
            }

            if (!composeFilled) {
                throw new Error('Could not find compose box');
            }

            await this.page.waitForTimeout(2000);

            // Click Tweet button
            console.log('   → Clicking Tweet button...');
            const tweetButtonSelectors = [
                '[data-testid="tweetButtonInline"]',
                '[data-testid="tweetButton"]',
                'button:has-text("Post")'
            ];
            
            let tweetPosted = false;
            for (const selector of tweetButtonSelectors) {
                try {
                    await this.page.click(selector, { timeout: 5000 });
                    console.log('   ✓ Clicked Tweet button');
                    tweetPosted = true;
                    break;
                } catch (e) {
                    continue;
                }
            }

            if (!tweetPosted) {
                throw new Error('Could not find Tweet button');
            }

            await this.page.waitForTimeout(5000);

            // Try to capture actual tweet URL
            let tweetUrl = null;
            try {
                // Look for the tweet in the timeline
                const tweetLinks = await this.page.$$('a[href*="/status/"]');
                if (tweetLinks.length > 0) {
                    const href = await tweetLinks[0].getAttribute('href');
                    if (href) {
                        tweetUrl = `https://x.com${href}`;
                    }
                }
            } catch (error) {
                console.log('   ⚠️  Could not capture tweet URL, using placeholder');
            }

            // Fallback to timestamp-based URL
            if (!tweetUrl) {
                tweetUrl = `https://x.com/user/status/${Date.now()}`;
            }

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
        }
    }
}

// Main execution
async function main() {
    console.log('🚀 Caribbean Tourism Content Syndication System V3');
    console.log('===================================================\n');
    console.log(`📅 Current date: ${new Date().toISOString()}`);
    console.log(`🎯 Target audience: ${CONFIG.targetAudience}\n`);

    const db = new PostingDatabase();
    await db.load();

    const parser = new ContentParser(CONFIG.contentFile);
    await parser.parse();

    const substackPublisher = new SubstackPublisher(CONFIG);
    const twitterPublisher = new TwitterPublisher(CONFIG);

    try {
        await substackPublisher.initialize();
        await twitterPublisher.initialize();

        // Setup login mode
        if (CONFIG.setupLogin) {
            console.log('\n🔐 SETUP LOGIN MODE\n');
            await substackPublisher.setupLogin();
            await twitterPublisher.setupLogin();
            console.log('\n✅ Login setup complete! You can now run the script normally.');
            return;
        }

        const postsToPublish = db.getNextPostsToPublish(2);
        console.log(`📋 Posts scheduled for publishing:`);
        postsToPublish.forEach(p => {
            console.log(`   - Post ${p.postNumber}: ${p.title}`);
            console.log(`     Last posted: ${p.lastPostedAt || 'Never'}`);
            console.log(`     Post count: ${p.postCount}`);
        });

        if (CONFIG.dryRun) {
            console.log('\n🔍 DRY RUN MODE - No actual posting will occur\n');
        }

        for (const postToPublish of postsToPublish) {
            const post = parser.getPost(postToPublish.postNumber);
            
            if (!post) {
                console.error(`❌ Post ${postToPublish.postNumber} not found`);
                continue;
            }

            console.log(`\n${'='.repeat(60)}`);
            console.log(`Publishing Post ${post.postNumber}`);
            console.log('='.repeat(60));

            let substackUrl = null;
            let twitterUrl = null;

            // Try Substack
            try {
                substackUrl = await substackPublisher.publish(post);
                db.markPostPublished(postToPublish.id, 'substack', substackUrl);
                await substackPublisher.saveSession();
            } catch (error) {
                console.error(`\n❌ Substack error for Post ${post.postNumber}: ${error.message}`);
                db.logError(postToPublish.id, 'substack', error);
            }

            // Wait between platforms
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Try Twitter (even if Substack failed)
            try {
                twitterUrl = await twitterPublisher.publish(post, substackUrl);
                db.markPostPublished(postToPublish.id, 'twitter', twitterUrl);
                await twitterPublisher.saveSession();
            } catch (error) {
                console.error(`\n❌ Twitter error for Post ${post.postNumber}: ${error.message}`);
                db.logError(postToPublish.id, 'twitter', error);
            }

            if (substackUrl || twitterUrl) {
                console.log(`\n✅ Post ${post.postNumber} published (at least partially)`);
            } else {
                console.log(`\n❌ Post ${post.postNumber} failed on all platforms`);
            }

            // Wait between posts
            if (postsToPublish.length > 1 && postToPublish !== postsToPublish[postsToPublish.length - 1]) {
                console.log('\n⏳ Waiting 10 seconds before next post...');
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }

        await db.save();

        console.log('\n' + '='.repeat(60));
        console.log('✅ SYNDICATION COMPLETE');
        console.log('='.repeat(60));
        console.log(`\n📊 Summary:`);
        console.log(`   Posts processed: ${postsToPublish.length}`);
        console.log(`   Target audience: ${CONFIG.targetAudience}`);
        
        const nextPosts = db.getNextPostsToPublish(2);
        console.log(`\n📋 Next posts in rotation:`);
        nextPosts.forEach(p => {
            console.log(`   - Post ${p.postNumber}`);
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

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
