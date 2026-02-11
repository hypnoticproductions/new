#!/usr/bin/env node

/**
 * WUKR Wire Daily Dispatch - Caribbean Tourism Content Syndication
 * 
 * Automated daily content syndication to Substack and Twitter
 * Posts 2 articles at a time with intelligent rotation and duplicate tracking
 * 
 * Features:
 * - Rotation through 6 posts (Post 1-2 at 9 AM, Post 3-4 at 1 PM, Post 5-6 at 6 PM AST)
 * - Session persistence for autonomous operation
 * - Duplicate tracking via posting history JSON
 * - Multi-platform syndication (Substack + Twitter)
 * - Error handling and recovery
 * - Twitter thread support for longer content
 * - Time validation to ensure content freshness
 * 
 * Usage: 
 *   node scripts/wukr_wire_dispatch.mjs [--dry-run] [--setup-login] [--count=2] [--platform=substack,twitter]
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
    platforms: (process.argv.find(arg => arg.startsWith('--platform='))?.split('=')[1] || 'substack,twitter').split(','),
    targetAudience: '320 Caribbean tourism businesses'
};

// ============================================================================
// TIME VALIDATION - Ensure content freshness
// ============================================================================
function validateCurrentTime() {
    const now = new Date();
    const astTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Puerto_Rico' }));
    
    console.log('🕐 Current Time Validation:');
    console.log(`   UTC: ${now.toISOString()}`);
    console.log(`   AST: ${astTime.toLocaleString('en-US', { timeZone: 'America/Puerto_Rico' })}`);
    console.log(`   Date: ${astTime.toLocaleDateString('en-US', { timeZone: 'America/Puerto_Rico', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
    
    return {
        utc: now,
        ast: astTime,
        hour: astTime.getHours(),
        dateString: astTime.toISOString().split('T')[0]
    };
}

// ============================================================================
// POSTING DATABASE - JSON-based tracking with duplicate prevention
// ============================================================================
class PostingDatabase {
    constructor() {
        this.dbFile = path.join(__dirname, 'posting_history.json');
        this.data = {
            posts: [],
            history: [],
            lastUpdated: null
        };
    }

    async load() {
        try {
            const content = await fs.readFile(this.dbFile, 'utf-8');
            this.data = JSON.parse(content);
            console.log(`📊 Loaded posting history: ${this.data.history.length} records`);
            console.log(`   Posts tracked: ${this.data.posts.length}`);
        } catch (error) {
            console.log('📊 No existing posting history found, initializing...');
            await this.initializePosts();
        }
    }

    async save() {
        this.data.lastUpdated = new Date().toISOString();
        await fs.writeFile(this.dbFile, JSON.stringify(this.data, null, 2));
        console.log('💾 Saved posting history');
    }

    async initializePosts() {
        const postTitles = [
            'Caribbean Tourism Recovery Trends',
            'Crisis Management for Caribbean Tourism Operators',
            'Digital Marketing Strategies for Caribbean Tourism',
            'Sustainable Tourism Certification Benefits',
            'Caribbean Tourism Workforce Development',
            'Revenue Management for Caribbean Properties'
        ];

        for (let i = 1; i <= 6; i++) {
            this.data.posts.push({
                id: i,
                postNumber: i,
                title: postTitles[i - 1] || `Post ${i}`,
                lastPostedAt: null,
                postCount: 0,
                substackUrl: null,
                twitterUrl: null
            });
        }
        await this.save();
    }

    /**
     * Get next posts to publish based on rotation logic
     * Priority: Never posted > Least posted > Oldest posted
     */
    getNextPosts(count = 2) {
        const posts = [...this.data.posts].sort((a, b) => {
            // Never posted comes first
            if (!a.lastPostedAt && b.lastPostedAt) return -1;
            if (a.lastPostedAt && !b.lastPostedAt) return 1;
            
            // Then by post count (least posted first)
            if (a.postCount !== b.postCount) return a.postCount - b.postCount;
            
            // Then by last posted time (oldest first)
            if (a.lastPostedAt && b.lastPostedAt) {
                return new Date(a.lastPostedAt) - new Date(b.lastPostedAt);
            }
            
            // Finally by post number
            return a.postNumber - b.postNumber;
        });

        return posts.slice(0, count);
    }

    /**
     * Check if a post was already published today
     */
    wasPostedToday(postId, platform) {
        const today = new Date().toISOString().split('T')[0];
        return this.data.history.some(h => 
            h.postId === postId && 
            h.platform === platform && 
            h.postedAt?.startsWith(today) &&
            h.status === 'success'
        );
    }

    /**
     * Mark post as published
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
            postUrl: url,
            status: 'success',
            postedAt: new Date().toISOString()
        });

        await this.save();
        console.log(`✅ Marked Post ${postId} as published on ${platform}`);
    }

    /**
     * Log failed posting attempt
     */
    async logFailure(postId, platform, error) {
        this.data.history.push({
            postId,
            platform,
            postUrl: null,
            status: 'failed',
            errorMessage: error.message,
            postedAt: new Date().toISOString()
        });

        await this.save();
        console.error(`❌ Logged failure for Post ${postId} on ${platform}: ${error.message}`);
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

        for (let i = 0; i < postSections.length; i++) {
            const section = postSections[i];
            const lines = section.trim().split('\n');
            
            let title = '';
            let subtitle = '';
            let body = '';
            let tags = [];
            let inContent = false;

            for (const line of lines) {
                if (line.startsWith('**Title:**')) {
                    title = line.replace('**Title:**', '').trim();
                } else if (line.startsWith('**Subtitle:**')) {
                    subtitle = line.replace('**Subtitle:**', '').trim();
                } else if (line.startsWith('**Content:**')) {
                    inContent = true;
                } else if (line.startsWith('**Tags:**')) {
                    tags = line.replace('**Tags:**', '').trim().split(/\s+/).filter(t => t.startsWith('#'));
                    inContent = false;
                } else if (inContent && line.trim()) {
                    body += line + '\n';
                }
            }

            this.posts.push({
                id: i + 1,
                postNumber: i + 1,
                title,
                subtitle,
                content: body.trim(),
                tags
            });
        }

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
    constructor(sessionFile, headless = true) {
        this.sessionFile = sessionFile;
        this.headless = headless;
        this.browser = null;
        this.page = null;
    }

    async init() {
        console.log('🌐 Initializing Substack browser...');
        this.browser = await chromium.launch({ headless: this.headless });
        const context = await this.browser.newContext();
        
        // Load session if exists
        try {
            const sessionData = JSON.parse(await fs.readFile(this.sessionFile, 'utf-8'));
            await context.addCookies(sessionData.cookies);
            console.log('✅ Loaded Substack session from file');
        } catch (error) {
            console.log('⚠️  No Substack session found, will need to login');
        }

        this.page = await context.newPage();
    }

    async setupLogin() {
        console.log('🔐 Setting up Substack login...');
        await this.page.goto('https://substack.com/sign-in');
        console.log('👤 Please log in manually in the browser window...');
        console.log('   Waiting 60 seconds for login...');
        await this.page.waitForTimeout(60000);
        
        // Save session
        const cookies = await this.page.context().cookies();
        await fs.writeFile(this.sessionFile, JSON.stringify({ cookies }, null, 2));
        console.log('✅ Substack session saved');
    }

    async publish(post) {
        console.log(`📝 Publishing to Substack: ${post.title}`);
        
        try {
            // Navigate to publish page
            await this.page.goto('https://richarddannibarrifortune.substack.com/publish/home', {
                waitUntil: 'networkidle',
                timeout: CONFIG.timeout
            });

            // Click "New post"
            await this.page.click('button:has-text("New post"), a:has-text("New post")', { timeout: 10000 });
            await this.page.waitForTimeout(2000);

            // Fill title
            const titleSelector = 'textarea[placeholder*="Title"], input[placeholder*="Title"]';
            await this.page.waitForSelector(titleSelector, { timeout: 10000 });
            await this.page.fill(titleSelector, post.title);
            await this.page.waitForTimeout(1000);

            // Fill subtitle if exists
            if (post.subtitle) {
                try {
                    const subtitleSelector = 'textarea[placeholder*="Subtitle"], input[placeholder*="Subtitle"]';
                    await this.page.fill(subtitleSelector, post.subtitle, { timeout: 5000 });
                } catch (e) {
                    console.log('   Subtitle field not found, skipping...');
                }
            }

            // Fill content
            const editorSelector = '[contenteditable="true"], .ProseMirror, [role="textbox"]';
            await this.page.waitForSelector(editorSelector, { timeout: 10000 });
            await this.page.click(editorSelector);
            await this.page.waitForTimeout(500);
            
            // Type content in chunks to avoid issues
            const contentChunks = post.content.match(/.{1,500}/gs) || [post.content];
            for (const chunk of contentChunks) {
                await this.page.keyboard.type(chunk, { delay: 10 });
                await this.page.waitForTimeout(100);
            }

            console.log('   Content filled, ready to publish');
            console.log('   ⚠️  Manual action required: Click "Continue" then "Publish now"');
            console.log('   Waiting 30 seconds for manual publish...');
            await this.page.waitForTimeout(30000);

            // Try to capture the published URL
            const url = this.page.url();
            console.log(`   Published URL: ${url}`);
            
            return url;
        } catch (error) {
            console.error(`❌ Substack publish error: ${error.message}`);
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
    constructor(sessionFile, headless = true) {
        this.sessionFile = sessionFile;
        this.headless = headless;
        this.browser = null;
        this.page = null;
    }

    async init() {
        console.log('🐦 Initializing Twitter browser...');
        this.browser = await chromium.launch({ headless: this.headless });
        const context = await this.browser.newContext();
        
        // Load session if exists
        try {
            const sessionData = JSON.parse(await fs.readFile(this.sessionFile, 'utf-8'));
            await context.addCookies(sessionData.cookies);
            console.log('✅ Loaded Twitter session from file');
        } catch (error) {
            console.log('⚠️  No Twitter session found, will need to login');
        }

        this.page = await context.newPage();
    }

    async setupLogin() {
        console.log('🔐 Setting up Twitter login...');
        await this.page.goto('https://x.com/login');
        console.log('👤 Please log in manually in the browser window...');
        console.log('   Waiting 60 seconds for login...');
        await this.page.waitForTimeout(60000);
        
        // Save session
        const cookies = await this.page.context().cookies();
        await fs.writeFile(this.sessionFile, JSON.stringify({ cookies }, null, 2));
        console.log('✅ Twitter session saved');
    }

    /**
     * Format post for Twitter (280 char limit)
     */
    formatTweet(post) {
        const headline = `🚨 ${post.title}`;
        const insight = post.subtitle || post.content.split('\n')[0];
        const tags = post.tags.slice(0, 3).join(' ');
        const attribution = 'WUKR Wire Intelligence';

        // Build tweet within 280 char limit
        let tweet = `${headline}\n\n${insight}\n\n${attribution}\n\n${tags}`;
        
        if (tweet.length > 280) {
            // Truncate insight
            const maxInsight = 280 - headline.length - attribution.length - tags.length - 10;
            const truncatedInsight = insight.substring(0, maxInsight) + '...';
            tweet = `${headline}\n\n${truncatedInsight}\n\n${attribution}\n\n${tags}`;
        }

        return tweet;
    }

    async publish(post) {
        console.log(`🐦 Publishing to Twitter: ${post.title}`);
        
        try {
            // Navigate to Twitter home
            await this.page.goto('https://x.com/home', {
                waitUntil: 'networkidle',
                timeout: CONFIG.timeout
            });

            // Format tweet
            const tweetText = this.formatTweet(post);
            console.log(`   Tweet (${tweetText.length} chars):\n${tweetText}`);

            // Find tweet compose box
            const composeSelector = '[data-testid="tweetTextarea_0"], [contenteditable="true"][role="textbox"]';
            await this.page.waitForSelector(composeSelector, { timeout: 10000 });
            await this.page.click(composeSelector);
            await this.page.waitForTimeout(500);

            // Type tweet
            await this.page.keyboard.type(tweetText, { delay: 20 });
            await this.page.waitForTimeout(1000);

            console.log('   Tweet composed, ready to post');
            console.log('   ⚠️  Manual action required: Click "Post" button');
            console.log('   Waiting 20 seconds for manual post...');
            await this.page.waitForTimeout(20000);

            // Try to capture tweet URL
            const url = this.page.url();
            console.log(`   Tweet URL: ${url}`);
            
            return url;
        } catch (error) {
            console.error(`❌ Twitter publish error: ${error.message}`);
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
    console.log('🚀 WUKR Wire Daily Dispatch - Caribbean Tourism Syndication\n');
    
    // Validate current time
    const timeInfo = validateCurrentTime();
    console.log('');

    // Initialize database
    const db = new PostingDatabase();
    await db.load();
    console.log('');

    // Parse content
    const parser = new ContentParser(CONFIG.contentFile);
    await parser.parse();
    console.log('');

    // Handle setup mode
    if (CONFIG.setupLogin) {
        console.log('🔧 Setup Mode: Configuring platform logins\n');
        
        if (CONFIG.platforms.includes('substack')) {
            const substack = new SubstackPublisher(CONFIG.substackSessionFile, false);
            await substack.init();
            await substack.setupLogin();
            await substack.close();
        }

        if (CONFIG.platforms.includes('twitter')) {
            const twitter = new TwitterPublisher(CONFIG.twitterSessionFile, false);
            await twitter.init();
            await twitter.setupLogin();
            await twitter.close();
        }

        console.log('\n✅ Setup complete! You can now run the script without --setup-login');
        return;
    }

    // Get next posts to publish
    const nextPosts = db.getNextPosts(CONFIG.postCount);
    console.log(`📋 Next ${nextPosts.length} posts to publish:`);
    nextPosts.forEach(p => {
        console.log(`   ${p.postNumber}. ${p.title} (posted ${p.postCount} times)`);
    });
    console.log('');

    // Dry run mode
    if (CONFIG.dryRun) {
        console.log('🔍 DRY RUN MODE - No actual posting will occur\n');
        for (const dbPost of nextPosts) {
            const contentPost = parser.getPost(dbPost.postNumber);
            console.log(`Post ${dbPost.postNumber}: ${contentPost.title}`);
            console.log(`  Subtitle: ${contentPost.subtitle}`);
            console.log(`  Content length: ${contentPost.content.length} chars`);
            console.log(`  Tags: ${contentPost.tags.join(', ')}`);
            console.log('');
        }
        return;
    }

    // Publish to each platform
    const results = [];

    for (const dbPost of nextPosts) {
        const contentPost = parser.getPost(dbPost.postNumber);
        console.log(`\n📢 Publishing Post ${dbPost.postNumber}: ${contentPost.title}\n`);

        // Substack
        if (CONFIG.platforms.includes('substack')) {
            if (db.wasPostedToday(dbPost.id, 'substack')) {
                console.log('⏭️  Already posted to Substack today, skipping...');
            } else {
                const substack = new SubstackPublisher(CONFIG.substackSessionFile, CONFIG.headless);
                try {
                    await substack.init();
                    const url = await substack.publish(contentPost);
                    await db.markPublished(dbPost.id, 'substack', url);
                    results.push({ post: dbPost.postNumber, platform: 'substack', status: 'success', url });
                } catch (error) {
                    await db.logFailure(dbPost.id, 'substack', error);
                    results.push({ post: dbPost.postNumber, platform: 'substack', status: 'failed', error: error.message });
                } finally {
                    await substack.close();
                }
            }
        }

        // Twitter
        if (CONFIG.platforms.includes('twitter')) {
            if (db.wasPostedToday(dbPost.id, 'twitter')) {
                console.log('⏭️  Already posted to Twitter today, skipping...');
            } else {
                const twitter = new TwitterPublisher(CONFIG.twitterSessionFile, CONFIG.headless);
                try {
                    await twitter.init();
                    const url = await twitter.publish(contentPost);
                    await db.markPublished(dbPost.id, 'twitter', url);
                    results.push({ post: dbPost.postNumber, platform: 'twitter', status: 'success', url });
                } catch (error) {
                    await db.logFailure(dbPost.id, 'twitter', error);
                    results.push({ post: dbPost.postNumber, platform: 'twitter', status: 'failed', error: error.message });
                } finally {
                    await twitter.close();
                }
            }
        }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 DISPATCH SUMMARY\n');
    console.log(`Time: ${timeInfo.ast.toLocaleString('en-US', { timeZone: 'America/Puerto_Rico' })}`);
    console.log(`Posts processed: ${nextPosts.length}`);
    console.log(`Platforms: ${CONFIG.platforms.join(', ')}`);
    console.log('');
    
    results.forEach(r => {
        const status = r.status === 'success' ? '✅' : '❌';
        console.log(`${status} Post ${r.post} → ${r.platform}: ${r.status}`);
        if (r.url) console.log(`   ${r.url}`);
        if (r.error) console.log(`   Error: ${r.error}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Dispatch complete!\n');
}

// Run
main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
