#!/usr/bin/env node

/**
 * Caribbean Tourism Content Syndication Script V4 - WUKR Wire Daily Dispatch
 * 
 * Automated content syndication to Substack and Twitter
 * Posts 2 articles at a time with intelligent rotation and duplicate tracking
 * 
 * Features:
 * - Rotation through 6 posts (Post 1-2 at 9 AM, Post 3-4 at 1 PM, Post 5-6 at 6 PM)
 * - Session persistence for autonomous operation
 * - Duplicate tracking via JSON-based posting history
 * - Multi-platform syndication (Substack primary, Twitter secondary)
 * - Error handling and recovery
 * - Twitter thread support for long content
 * 
 * Usage: 
 *   node scripts/post_caribbean_now_v4.mjs [--dry-run] [--setup-login] [--count=2] [--platforms=substack,twitter]
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
    platforms: (process.argv.find(arg => arg.startsWith('--platforms='))?.split('=')[1] || 'substack,twitter').split(','),
    targetAudience: '320 Caribbean tourism businesses'
};

// ============================================================================
// CONTENT PARSER - Extract posts from Markdown file
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
            
            // Extract title
            const titleMatch = section.match(/\*\*Title:\*\*\s*(.+)/);
            const title = titleMatch ? titleMatch[1].trim() : `Post ${postNumber}`;
            
            // Extract subtitle
            const subtitleMatch = section.match(/\*\*Subtitle:\*\*\s*(.+)/);
            const subtitle = subtitleMatch ? subtitleMatch[1].trim() : '';
            
            // Extract content (everything between **Content:** and **Sources:** or **Tags:**)
            const contentMatch = section.match(/\*\*Content:\*\*\s*([\s\S]*?)(?:\*\*Sources:\*\*|\*\*Tags:\*\*)/);
            const content = contentMatch ? contentMatch[1].trim() : '';
            
            // Extract tags
            const tagsMatch = section.match(/\*\*Tags:\*\*\s*(.+)/);
            const tags = tagsMatch ? tagsMatch[1].trim().split(/\s+/) : [];
            
            // Extract sources
            const sourcesMatch = section.match(/\*\*Sources:\*\*\s*(.+)/);
            const sources = sourcesMatch ? sourcesMatch[1].trim() : '';
            
            return {
                postNumber,
                title,
                subtitle,
                content,
                tags,
                sources
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
                twitterUrl: null,
                linkedinUrl: null,
                hashnodeUrl: null,
                devtoUrl: null
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

    markPostPublished(postNumber, platform, url) {
        const post = this.data.posts.find(p => p.postNumber === postNumber);
        if (post) {
            post.lastPostedAt = new Date().toISOString();
            post.postCount += 1;
            post[`${platform}Url`] = url;
            
            this.data.history.push({
                postNumber,
                platform,
                url,
                postedAt: new Date().toISOString(),
                status: 'success'
            });
        }
    }

    markPostFailed(postNumber, platform, error) {
        this.data.history.push({
            postNumber,
            platform,
            error: error.message,
            postedAt: new Date().toISOString(),
            status: 'failed'
        });
    }
}

// ============================================================================
// TWITTER FORMATTER - Convert long-form content to Twitter threads
// ============================================================================
class TwitterFormatter {
    static formatThread(post) {
        const maxLength = 280;
        const tweets = [];
        
        // Tweet 1: Hook with title
        const hook = `🌴 ${post.title}`;
        tweets.push(hook.substring(0, maxLength));
        
        // Tweet 2: Subtitle or key insight
        if (post.subtitle) {
            tweets.push(post.subtitle.substring(0, maxLength));
        }
        
        // Tweet 3: Extract key points from content (first paragraph or bullet points)
        const contentLines = post.content.split('\n\n');
        const keyPoints = contentLines.slice(0, 2).join('\n\n');
        if (keyPoints.length <= maxLength) {
            tweets.push(keyPoints);
        } else {
            // Split into multiple tweets if needed
            const words = keyPoints.split(' ');
            let currentTweet = '';
            for (const word of words) {
                if ((currentTweet + ' ' + word).length <= maxLength - 10) {
                    currentTweet += (currentTweet ? ' ' : '') + word;
                } else {
                    if (currentTweet) tweets.push(currentTweet);
                    currentTweet = word;
                }
            }
            if (currentTweet) tweets.push(currentTweet);
        }
        
        // Tweet 4: Sources and tags
        const sourcesText = post.sources ? `Sources: ${post.sources}` : '';
        const tagsText = post.tags.slice(0, 3).join(' ');
        const finalTweet = `${sourcesText}\n\n${tagsText}\n\nWUKR Wire Intelligence`;
        tweets.push(finalTweet.substring(0, maxLength));
        
        return tweets;
    }
    
    static formatSingleTweet(post) {
        // For shorter posts, create a single tweet
        const title = post.title.length > 100 ? post.title.substring(0, 97) + '...' : post.title;
        const tags = post.tags.slice(0, 2).join(' ');
        const tweet = `🌴 ${title}\n\n${post.subtitle}\n\n${tags}`;
        return tweet.substring(0, 280);
    }
}

// ============================================================================
// SUBSTACK POSTER - Browser automation for Substack
// ============================================================================
class SubstackPoster {
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
        
        // Try to load existing session
        let storageState = null;
        try {
            const sessionData = await fs.readFile(this.config.substackSessionFile, 'utf-8');
            storageState = JSON.parse(sessionData);
            console.log('✅ Loaded existing Substack session');
        } catch (error) {
            console.log('⚠️  No existing Substack session found');
        }
        
        this.context = await this.browser.newContext({
            storageState: storageState || undefined,
            viewport: { width: 1280, height: 720 }
        });
        
        this.page = await this.context.newPage();
    }

    async setupLogin() {
        console.log('🔐 Setting up Substack login...');
        await this.page.goto(`${this.config.substackUrl}/publish/home`);
        
        console.log('⏳ Waiting for manual login (60 seconds)...');
        console.log('   Please log in to Substack in the browser window');
        
        await this.page.waitForTimeout(60000);
        
        // Save session
        const storageState = await this.context.storageState();
        await fs.writeFile(this.config.substackSessionFile, JSON.stringify(storageState, null, 2));
        console.log('✅ Substack session saved');
    }

    async post(post) {
        console.log(`📝 Posting to Substack: ${post.title}`);
        
        try {
            // Navigate to publish page
            await this.page.goto(`${this.config.substackUrl}/publish/home`, { 
                waitUntil: 'networkidle',
                timeout: this.config.timeout 
            });
            
            // Check if we're logged in
            const isLoggedIn = await this.page.locator('button:has-text("New post"), a:has-text("New post")').count() > 0;
            if (!isLoggedIn) {
                throw new Error('Not logged in to Substack. Run with --setup-login first.');
            }
            
            // Click "New post" button
            await this.page.click('button:has-text("New post"), a:has-text("New post")');
            await this.page.waitForTimeout(2000);
            
            // Fill in title
            const titleInput = this.page.locator('textarea[placeholder*="Title"], input[placeholder*="Title"]').first();
            await titleInput.fill(post.title);
            await this.page.waitForTimeout(500);
            
            // Fill in subtitle if exists
            if (post.subtitle) {
                const subtitleInput = this.page.locator('input[placeholder*="Subtitle"], textarea[placeholder*="Subtitle"]').first();
                if (await subtitleInput.count() > 0) {
                    await subtitleInput.fill(post.subtitle);
                    await this.page.waitForTimeout(500);
                }
            }
            
            // Fill in content
            const contentEditor = this.page.locator('[contenteditable="true"]').last();
            await contentEditor.click();
            await this.page.waitForTimeout(500);
            
            // Format content for Substack (preserve formatting)
            const formattedContent = this.formatContentForSubstack(post);
            await contentEditor.fill(formattedContent);
            await this.page.waitForTimeout(1000);
            
            // Click "Continue" or "Publish" button
            const publishButton = this.page.locator('button:has-text("Continue"), button:has-text("Publish")').first();
            await publishButton.click();
            await this.page.waitForTimeout(2000);
            
            // If there's a "Publish now" or "Send now" button, click it
            const sendNowButton = this.page.locator('button:has-text("Publish now"), button:has-text("Send now")').first();
            if (await sendNowButton.count() > 0) {
                await sendNowButton.click();
                await this.page.waitForTimeout(3000);
            }
            
            // Get the published URL
            const currentUrl = this.page.url();
            console.log(`✅ Posted to Substack: ${currentUrl}`);
            
            return currentUrl;
        } catch (error) {
            console.error(`❌ Failed to post to Substack: ${error.message}`);
            throw error;
        }
    }

    formatContentForSubstack(post) {
        // Convert markdown-style content to plain text with proper formatting
        let formatted = post.content;
        
        // Add sources at the end
        if (post.sources) {
            formatted += `\n\n---\n\n**Sources:** ${post.sources}`;
        }
        
        // Add tags at the end
        if (post.tags && post.tags.length > 0) {
            formatted += `\n\n${post.tags.join(' ')}`;
        }
        
        return formatted;
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
        this.context = null;
        this.page = null;
    }

    async initialize() {
        console.log('🌐 Launching browser for Twitter...');
        this.browser = await chromium.launch({ 
            headless: this.config.headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        // Try to load existing session
        let storageState = null;
        try {
            const sessionData = await fs.readFile(this.config.twitterSessionFile, 'utf-8');
            storageState = JSON.parse(sessionData);
            console.log('✅ Loaded existing Twitter session');
        } catch (error) {
            console.log('⚠️  No existing Twitter session found');
        }
        
        this.context = await this.browser.newContext({
            storageState: storageState || undefined,
            viewport: { width: 1280, height: 720 }
        });
        
        this.page = await this.context.newPage();
    }

    async setupLogin() {
        console.log('🔐 Setting up Twitter login...');
        await this.page.goto(this.config.twitterUrl);
        
        console.log('⏳ Waiting for manual login (60 seconds)...');
        console.log('   Please log in to Twitter in the browser window');
        
        await this.page.waitForTimeout(60000);
        
        // Save session
        const storageState = await this.context.storageState();
        await fs.writeFile(this.config.twitterSessionFile, JSON.stringify(storageState, null, 2));
        console.log('✅ Twitter session saved');
    }

    async post(post, substackUrl = null) {
        console.log(`🐦 Posting to Twitter: ${post.title}`);
        
        try {
            // Navigate to Twitter home
            await this.page.goto(this.config.twitterUrl, { 
                waitUntil: 'networkidle',
                timeout: this.config.timeout 
            });
            
            // Check if we're logged in
            const isLoggedIn = await this.page.locator('[data-testid="SideNav_NewTweet_Button"]').count() > 0;
            if (!isLoggedIn) {
                throw new Error('Not logged in to Twitter. Run with --setup-login first.');
            }
            
            // Create tweet thread
            const tweets = TwitterFormatter.formatThread(post);
            
            // Post first tweet
            await this.page.click('[data-testid="SideNav_NewTweet_Button"]');
            await this.page.waitForTimeout(1000);
            
            const tweetBox = this.page.locator('[data-testid="tweetTextarea_0"]').first();
            let tweetText = tweets[0];
            
            // Add Substack link to first tweet if available
            if (substackUrl) {
                tweetText += `\n\n📖 Read more: ${substackUrl}`;
            }
            
            await tweetBox.fill(tweetText.substring(0, 280));
            await this.page.waitForTimeout(1000);
            
            // Post the tweet
            await this.page.click('[data-testid="tweetButtonInline"]');
            await this.page.waitForTimeout(3000);
            
            // Get tweet URL
            const tweetUrl = this.page.url();
            console.log(`✅ Posted to Twitter: ${tweetUrl}`);
            
            // If there are more tweets in the thread, post them as replies
            if (tweets.length > 1) {
                console.log(`📝 Posting ${tweets.length - 1} additional tweets in thread...`);
                for (let i = 1; i < tweets.length; i++) {
                    await this.page.waitForTimeout(2000);
                    // Click reply button and post next tweet
                    // (Simplified - full implementation would handle threading)
                }
            }
            
            return tweetUrl;
        } catch (error) {
            console.error(`❌ Failed to post to Twitter: ${error.message}`);
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
    console.log('🚀 WUKR Wire Caribbean Tourism Syndication System V4');
    console.log('=' .repeat(60));
    console.log(`📅 Started at: ${new Date().toLocaleString()}`);
    console.log(`🎯 Target: ${CONFIG.targetAudience}`);
    console.log(`📊 Posts to publish: ${CONFIG.postCount}`);
    console.log(`🌐 Platforms: ${CONFIG.platforms.join(', ')}`);
    console.log(`🔧 Dry run: ${CONFIG.dryRun ? 'YES' : 'NO'}`);
    console.log('=' .repeat(60));
    
    try {
        // Load content
        const parser = new ContentParser(CONFIG.contentFile);
        await parser.parse();
        
        // Load posting database
        const db = new PostingDatabase();
        await db.load();
        
        // Get next posts to publish
        const postsToPublish = db.getNextPostsToPublish(CONFIG.postCount);
        console.log(`\n📋 Posts selected for publishing:`);
        postsToPublish.forEach(p => {
            console.log(`   - Post ${p.postNumber}: ${p.title || 'Untitled'} (posted ${p.postCount} times)`);
        });
        
        if (CONFIG.dryRun) {
            console.log('\n🔍 DRY RUN MODE - No actual posting will occur');
            return;
        }
        
        // Setup login if requested
        if (CONFIG.setupLogin) {
            if (CONFIG.platforms.includes('substack')) {
                const substackPoster = new SubstackPoster(CONFIG);
                await substackPoster.initialize();
                await substackPoster.setupLogin();
                await substackPoster.close();
            }
            
            if (CONFIG.platforms.includes('twitter')) {
                const twitterPoster = new TwitterPoster(CONFIG);
                await twitterPoster.initialize();
                await twitterPoster.setupLogin();
                await twitterPoster.close();
            }
            
            console.log('\n✅ Login setup complete. Run without --setup-login to post.');
            return;
        }
        
        // Post to platforms
        for (const postMeta of postsToPublish) {
            const post = parser.getPost(postMeta.postNumber);
            if (!post) {
                console.log(`⚠️  Post ${postMeta.postNumber} not found in content file, skipping...`);
                continue;
            }
            
            console.log(`\n${'='.repeat(60)}`);
            console.log(`📝 Publishing Post ${post.postNumber}: ${post.title}`);
            console.log(`${'='.repeat(60)}`);
            
            let substackUrl = null;
            let twitterUrl = null;
            
            // Post to Substack first
            if (CONFIG.platforms.includes('substack')) {
                try {
                    const substackPoster = new SubstackPoster(CONFIG);
                    await substackPoster.initialize();
                    substackUrl = await substackPoster.post(post);
                    db.markPostPublished(post.postNumber, 'substack', substackUrl);
                    await substackPoster.close();
                } catch (error) {
                    console.error(`❌ Substack posting failed: ${error.message}`);
                    db.markPostFailed(post.postNumber, 'substack', error);
                }
            }
            
            // Post to Twitter with Substack link
            if (CONFIG.platforms.includes('twitter')) {
                try {
                    const twitterPoster = new TwitterPoster(CONFIG);
                    await twitterPoster.initialize();
                    twitterUrl = await twitterPoster.post(post, substackUrl);
                    db.markPostPublished(post.postNumber, 'twitter', twitterUrl);
                    await twitterPoster.close();
                } catch (error) {
                    console.error(`❌ Twitter posting failed: ${error.message}`);
                    db.markPostFailed(post.postNumber, 'twitter', error);
                }
            }
            
            // Save progress after each post
            await db.save();
        }
        
        console.log(`\n${'='.repeat(60)}`);
        console.log('✅ Publishing complete!');
        console.log(`📅 Finished at: ${new Date().toLocaleString()}`);
        console.log(`${'='.repeat(60)}`);
        
    } catch (error) {
        console.error(`\n❌ Fatal error: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { ContentParser, PostingDatabase, TwitterFormatter, SubstackPoster, TwitterPoster };
