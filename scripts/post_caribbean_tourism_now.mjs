#!/usr/bin/env node

/**
 * Caribbean Tourism Content Syndication - WUKR Wire Daily Dispatch
 * 
 * Posts 2 Caribbean tourism-focused articles to Substack and Twitter
 * Target audience: 320 Caribbean tourism businesses
 * Rotation schedule: Post 1-2 at 9 AM, Post 3-4 at 1 PM, Post 5-6 at 6 PM AST
 * 
 * Features:
 * - Intelligent rotation through 6 posts with duplicate prevention
 * - JSON-based posting history tracking
 * - Session persistence for autonomous operation
 * - Multi-platform syndication (Substack + Twitter)
 * - Twitter thread support for longer content
 * - Error handling and recovery
 * 
 * Usage: 
 *   node scripts/post_caribbean_tourism_now.mjs [--dry-run] [--count=2] [--platform=substack,twitter]
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
    contentFile: path.join(__dirname, '../content/daily_posts_caribbean_tourism.md'),
    postingHistoryFile: path.join(__dirname, 'posting_history.json'),
    substackSessionFile: path.join(process.env.HOME, '.substack-session.json'),
    twitterSessionFile: path.join(process.env.HOME, '.twitter-session.json'),
    substackUrl: 'https://richarddannibarrifortune.substack.com',
    twitterUrl: 'https://x.com',
    headless: process.env.HEADLESS !== 'false',
    timeout: 60000,
    dryRun: process.argv.includes('--dry-run'),
    postCount: parseInt(process.argv.find(arg => arg.startsWith('--count='))?.split('=')[1] || '2'),
    platforms: (process.argv.find(arg => arg.startsWith('--platform='))?.split('=')[1] || 'substack,twitter').split(','),
    targetAudience: '320 Caribbean tourism businesses'
};

console.log(`
╔════════════════════════════════════════════════════════════════╗
║  WUKR Wire Daily Dispatch - Caribbean Tourism Syndication     ║
║  Target: ${CONFIG.targetAudience.padEnd(49)}║
╚════════════════════════════════════════════════════════════════╝
`);

console.log(`⚙️  Configuration:`);
console.log(`   Posts to publish: ${CONFIG.postCount}`);
console.log(`   Platforms: ${CONFIG.platforms.join(', ')}`);
console.log(`   Dry run: ${CONFIG.dryRun ? 'YES (no actual posting)' : 'NO'}`);
console.log(`   Headless mode: ${CONFIG.headless}`);
console.log('');

// ============================================================================
// POSTING DATABASE - JSON-based tracking with duplicate prevention
// ============================================================================
class PostingDatabase {
    constructor() {
        this.dbFile = CONFIG.postingHistoryFile;
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
            console.log(`📊 Loaded posting history: ${this.data.history.length} total records`);
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
        console.log('');
        
        return selected;
    }

    markPostPublished(postId, platform, url) {
        const post = this.data.posts.find(p => p.id === postId);
        if (post) {
            const now = new Date().toISOString();
            
            // Update last posted time and increment count
            post.lastPostedAt = now;
            post.postCount += 1;
            
            // Update platform-specific URL
            if (platform === 'substack') post.substackUrl = url;
            if (platform === 'twitter') post.twitterUrl = url;
        }

        // Add to history
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
            totalFailures: this.data.history.filter(h => h.status === 'failed').length,
            byPost: this.data.posts.map(p => ({
                postNumber: p.postNumber,
                title: p.title,
                postCount: p.postCount,
                lastPosted: p.lastPostedAt,
                substackUrl: p.substackUrl,
                twitterUrl: p.twitterUrl
            })),
            recentHistory: this.data.history.slice(-10)
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
        
        // Split by post headers
        const postSections = content.split(/^## Post \d+:/gm).slice(1);

        this.posts = postSections.map((section, index) => {
            const titleMatch = section.match(/\*\*Title:\*\*\s*(.+)/);
            const subtitleMatch = section.match(/\*\*Subtitle:\*\*\s*(.+)/);
            const tagsMatch = section.match(/\*\*Tags:\*\*\s*(.+)/);
            const sourcesMatch = section.match(/\*\*Sources:\*\*\s*(.+)/);
            
            // Extract content between **Content:** and **Sources:** or **Tags:**
            const contentMatch = section.match(/\*\*Content:\*\*\s*([\s\S]+?)(?:\*\*(?:Sources|Tags):|$)/);
            
            return {
                postNumber: index + 1,
                title: titleMatch ? titleMatch[1].trim() : `Post ${index + 1}`,
                subtitle: subtitleMatch ? subtitleMatch[1].trim() : '',
                content: contentMatch ? contentMatch[1].trim() : '',
                tags: tagsMatch ? tagsMatch[1].trim() : '',
                sources: sourcesMatch ? sourcesMatch[1].trim() : '',
                fullSection: section
            };
        });

        console.log(`📄 Parsed ${this.posts.length} posts from content file`);
        this.posts.forEach((p, i) => {
            console.log(`   Post ${i + 1}: ${p.title} (${p.content.length} chars)`);
        });
        console.log('');
        
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
        console.log('🌐 Initializing Substack browser...');
        
        this.browser = await chromium.launch({
            headless: this.config.headless,
            timeout: this.config.timeout
        });

        // Try to load saved session
        try {
            const sessionData = await fs.readFile(this.config.substackSessionFile, 'utf-8');
            const storageState = JSON.parse(sessionData);
            
            this.context = await this.browser.newContext({ storageState });
            console.log('✅ Loaded saved Substack session');
        } catch (error) {
            this.context = await this.browser.newContext();
            console.log('⚠️  No saved Substack session found - you may need to login');
        }

        this.page = await this.context.newPage();
    }

    async saveSession() {
        if (this.context) {
            const storageState = await this.context.storageState();
            await fs.writeFile(this.config.substackSessionFile, JSON.stringify(storageState, null, 2));
            console.log('💾 Saved Substack session');
        }
    }

    async checkLogin() {
        console.log('🔐 Checking Substack login status...');
        await this.page.goto(`${this.config.substackUrl}/publish/home`, { waitUntil: 'networkidle' });
        
        // Check if we're on the publish page (logged in) or redirected to login
        const url = this.page.url();
        if (url.includes('/sign-in') || url.includes('login')) {
            console.log('❌ Not logged in to Substack');
            console.log('   Please login manually and run again');
            return false;
        }
        
        console.log('✅ Logged in to Substack');
        await this.saveSession();
        return true;
    }

    async publishPost(post) {
        console.log(`\n📝 Publishing to Substack: "${post.title}"`);
        
        if (this.config.dryRun) {
            console.log('   [DRY RUN] Skipping actual publish');
            return `https://richarddannibarrifortune.substack.com/p/dry-run-${post.postNumber}`;
        }

        try {
            // Navigate to publish page
            await this.page.goto(`${this.config.substackUrl}/publish/home`, { waitUntil: 'networkidle' });
            
            // Click "New post" button
            await this.page.click('a[href*="/publish/post"]', { timeout: 10000 });
            await this.page.waitForTimeout(2000);

            // Fill in title
            const titleSelector = 'textarea[placeholder*="Title"], input[placeholder*="Title"]';
            await this.page.waitForSelector(titleSelector, { timeout: 10000 });
            await this.page.fill(titleSelector, post.title);
            await this.page.waitForTimeout(1000);

            // Fill in subtitle if exists
            if (post.subtitle) {
                const subtitleSelector = 'textarea[placeholder*="Subtitle"], input[placeholder*="Subtitle"]';
                try {
                    await this.page.fill(subtitleSelector, post.subtitle, { timeout: 5000 });
                } catch (e) {
                    console.log('   ⚠️  Could not find subtitle field, skipping');
                }
            }

            // Fill in content
            const contentSelector = 'div[contenteditable="true"], div.ProseMirror';
            await this.page.waitForSelector(contentSelector, { timeout: 10000 });
            
            // Format content for Substack
            const formattedContent = this.formatContentForSubstack(post);
            await this.page.click(contentSelector);
            await this.page.waitForTimeout(500);
            
            // Type content (Playwright handles formatting better with type than fill)
            await this.page.evaluate((content) => {
                const editor = document.querySelector('div[contenteditable="true"], div.ProseMirror');
                if (editor) {
                    editor.innerHTML = content;
                }
            }, formattedContent);
            
            await this.page.waitForTimeout(2000);

            // Click publish button
            const publishButtonSelector = 'button:has-text("Publish"), button:has-text("Continue")';
            await this.page.click(publishButtonSelector, { timeout: 10000 });
            await this.page.waitForTimeout(2000);

            // Confirm publish (if there's a confirmation dialog)
            try {
                const confirmSelector = 'button:has-text("Publish now"), button:has-text("Send now")';
                await this.page.click(confirmSelector, { timeout: 5000 });
                await this.page.waitForTimeout(3000);
            } catch (e) {
                console.log('   ℹ️  No confirmation dialog found');
            }

            // Get the published URL
            await this.page.waitForTimeout(2000);
            const publishedUrl = this.page.url();
            
            console.log(`✅ Published to Substack: ${publishedUrl}`);
            return publishedUrl;

        } catch (error) {
            console.error(`❌ Failed to publish to Substack: ${error.message}`);
            throw error;
        }
    }

    formatContentForSubstack(post) {
        // Convert markdown-style content to HTML for Substack
        let html = post.content;
        
        // Convert **bold** to <strong>
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        
        // Convert *italic* to <em>
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        
        // Convert line breaks to <p> tags
        html = html.split('\n\n').map(para => `<p>${para.trim()}</p>`).join('');
        
        // Add sources at the end
        if (post.sources) {
            html += `<p><em>Sources: ${post.sources}</em></p>`;
        }
        
        // Add tags
        if (post.tags) {
            html += `<p>${post.tags}</p>`;
        }
        
        return html;
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
        console.log('🐦 Initializing Twitter browser...');
        
        this.browser = await chromium.launch({
            headless: this.config.headless,
            timeout: this.config.timeout
        });

        // Try to load saved session
        try {
            const sessionData = await fs.readFile(this.config.twitterSessionFile, 'utf-8');
            const storageState = JSON.parse(sessionData);
            
            this.context = await this.browser.newContext({ storageState });
            console.log('✅ Loaded saved Twitter session');
        } catch (error) {
            this.context = await this.browser.newContext();
            console.log('⚠️  No saved Twitter session found - you may need to login');
        }

        this.page = await this.context.newPage();
    }

    async saveSession() {
        if (this.context) {
            const storageState = await this.context.storageState();
            await fs.writeFile(this.config.twitterSessionFile, JSON.stringify(storageState, null, 2));
            console.log('💾 Saved Twitter session');
        }
    }

    async checkLogin() {
        console.log('🔐 Checking Twitter login status...');
        await this.page.goto(this.config.twitterUrl, { waitUntil: 'networkidle' });
        
        // Check if we see the compose tweet button (logged in)
        const url = this.page.url();
        if (url.includes('/login') || url.includes('/i/flow/login')) {
            console.log('❌ Not logged in to Twitter');
            console.log('   Please login manually and run again');
            return false;
        }
        
        console.log('✅ Logged in to Twitter');
        await this.saveSession();
        return true;
    }

    async publishPost(post, substackUrl = null) {
        console.log(`\n🐦 Publishing to Twitter: "${post.title}"`);
        
        if (this.config.dryRun) {
            console.log('   [DRY RUN] Skipping actual tweet');
            return `https://x.com/dry-run/${post.postNumber}`;
        }

        try {
            // Navigate to home
            await this.page.goto(this.config.twitterUrl, { waitUntil: 'networkidle' });
            await this.page.waitForTimeout(2000);

            // Format tweet content
            const tweetText = this.formatTweetContent(post, substackUrl);
            
            // Check if we need a thread (content > 280 chars)
            if (tweetText.length <= 280) {
                return await this.publishSingleTweet(tweetText);
            } else {
                return await this.publishThread(post, substackUrl);
            }

        } catch (error) {
            console.error(`❌ Failed to publish to Twitter: ${error.message}`);
            throw error;
        }
    }

    async publishSingleTweet(text) {
        // Click compose tweet button
        const composeSelector = 'a[data-testid="SideNav_NewTweet_Button"], a[aria-label*="Post"]';
        await this.page.click(composeSelector, { timeout: 10000 });
        await this.page.waitForTimeout(1000);

        // Type tweet
        const tweetBoxSelector = 'div[data-testid="tweetTextarea_0"]';
        await this.page.waitForSelector(tweetBoxSelector, { timeout: 10000 });
        await this.page.click(tweetBoxSelector);
        await this.page.keyboard.type(text);
        await this.page.waitForTimeout(1000);

        // Click tweet button
        const tweetButtonSelector = 'button[data-testid="tweetButtonInline"]';
        await this.page.click(tweetButtonSelector, { timeout: 10000 });
        await this.page.waitForTimeout(3000);

        // Get tweet URL from the timeline
        const tweetUrl = await this.page.evaluate(() => {
            const tweets = document.querySelectorAll('article[data-testid="tweet"]');
            if (tweets.length > 0) {
                const link = tweets[0].querySelector('a[href*="/status/"]');
                return link ? `https://x.com${link.getAttribute('href')}` : null;
            }
            return null;
        });

        console.log(`✅ Published to Twitter: ${tweetUrl || 'URL not captured'}`);
        return tweetUrl || 'https://x.com/posted';
    }

    async publishThread(post, substackUrl) {
        console.log('   📝 Content exceeds 280 chars, creating thread...');
        
        // Create thread tweets
        const tweets = this.createThreadTweets(post, substackUrl);
        console.log(`   Creating thread with ${tweets.length} tweets`);

        // Click compose tweet button
        const composeSelector = 'a[data-testid="SideNav_NewTweet_Button"], a[aria-label*="Post"]';
        await this.page.click(composeSelector, { timeout: 10000 });
        await this.page.waitForTimeout(1000);

        // Type first tweet
        let tweetBoxSelector = 'div[data-testid="tweetTextarea_0"]';
        await this.page.waitForSelector(tweetBoxSelector, { timeout: 10000 });
        await this.page.click(tweetBoxSelector);
        await this.page.keyboard.type(tweets[0]);
        await this.page.waitForTimeout(500);

        // Add additional tweets to thread
        for (let i = 1; i < tweets.length; i++) {
            // Click add tweet button
            const addTweetSelector = 'button[data-testid="addButton"]';
            await this.page.click(addTweetSelector, { timeout: 5000 });
            await this.page.waitForTimeout(500);

            // Type next tweet
            tweetBoxSelector = `div[data-testid="tweetTextarea_${i}"]`;
            await this.page.waitForSelector(tweetBoxSelector, { timeout: 5000 });
            await this.page.click(tweetBoxSelector);
            await this.page.keyboard.type(tweets[i]);
            await this.page.waitForTimeout(500);
        }

        // Click tweet all button
        const tweetButtonSelector = 'button[data-testid="tweetButtonInline"]';
        await this.page.click(tweetButtonSelector, { timeout: 10000 });
        await this.page.waitForTimeout(3000);

        console.log(`✅ Published thread to Twitter`);
        return 'https://x.com/thread-posted';
    }

    formatTweetContent(post, substackUrl = null) {
        // Format: Title + short excerpt + link + hashtags
        let tweet = `🏝️ ${post.title}\n\n`;
        
        // Add a short excerpt (first 100 chars of content)
        const excerpt = post.content.substring(0, 100).trim() + '...';
        tweet += excerpt + '\n\n';
        
        // Add Substack link if available
        if (substackUrl) {
            tweet += `Read more: ${substackUrl}\n\n`;
        }
        
        // Add hashtags (limit to 2-3)
        const hashtags = post.tags.split(' ').slice(0, 3).join(' ');
        tweet += hashtags;
        
        return tweet;
    }

    createThreadTweets(post, substackUrl) {
        const tweets = [];
        
        // Tweet 1: Title and hook
        tweets.push(`🏝️ ${post.title}\n\n${post.subtitle}\n\nA thread 🧵👇`);
        
        // Tweet 2-N: Break content into chunks
        const contentChunks = this.splitContentIntoTweets(post.content);
        tweets.push(...contentChunks);
        
        // Final tweet: Link and hashtags
        let finalTweet = '';
        if (substackUrl) {
            finalTweet += `Read the full article:\n${substackUrl}\n\n`;
        }
        finalTweet += post.tags.split(' ').slice(0, 3).join(' ');
        tweets.push(finalTweet);
        
        return tweets;
    }

    splitContentIntoTweets(content) {
        const maxLength = 270; // Leave room for tweet numbers
        const tweets = [];
        
        // Split by paragraphs
        const paragraphs = content.split('\n\n').filter(p => p.trim());
        
        let currentTweet = '';
        for (const para of paragraphs) {
            if ((currentTweet + para).length <= maxLength) {
                currentTweet += para + '\n\n';
            } else {
                if (currentTweet) tweets.push(currentTweet.trim());
                currentTweet = para + '\n\n';
            }
        }
        
        if (currentTweet) tweets.push(currentTweet.trim());
        
        return tweets;
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
    const db = new PostingDatabase();
    const parser = new ContentParser(CONFIG.contentFile);
    
    try {
        // Load posting history
        await db.load();
        
        // Parse content file
        await parser.parse();
        
        // Get next posts to publish
        const postsToPublish = db.getNextPostsToPublish(CONFIG.postCount);
        
        if (postsToPublish.length === 0) {
            console.log('❌ No posts available to publish');
            return;
        }
        
        // Initialize publishers based on platform selection
        const publishers = {};
        
        if (CONFIG.platforms.includes('substack')) {
            publishers.substack = new SubstackPublisher(CONFIG);
            await publishers.substack.initialize();
            
            const loggedIn = await publishers.substack.checkLogin();
            if (!loggedIn) {
                console.log('\n⚠️  Please login to Substack and run again');
                await publishers.substack.close();
                return;
            }
        }
        
        if (CONFIG.platforms.includes('twitter')) {
            publishers.twitter = new TwitterPublisher(CONFIG);
            await publishers.twitter.initialize();
            
            const loggedIn = await publishers.twitter.checkLogin();
            if (!loggedIn) {
                console.log('\n⚠️  Please login to Twitter and run again');
                await publishers.twitter.close();
                return;
            }
        }
        
        // Publish posts
        console.log('\n' + '='.repeat(70));
        console.log('STARTING PUBLICATION');
        console.log('='.repeat(70));
        
        for (const postToPublish of postsToPublish) {
            const postContent = parser.getPost(postToPublish.postNumber);
            
            if (!postContent) {
                console.log(`❌ Could not find content for post ${postToPublish.postNumber}`);
                continue;
            }
            
            let substackUrl = null;
            
            // Publish to Substack first
            if (publishers.substack) {
                try {
                    substackUrl = await publishers.substack.publishPost(postContent);
                    db.markPostPublished(postToPublish.id, 'substack', substackUrl);
                    await db.save();
                } catch (error) {
                    console.error(`❌ Substack publish failed: ${error.message}`);
                    db.logError(postToPublish.id, 'substack', error);
                    await db.save();
                }
            }
            
            // Then publish to Twitter with Substack link
            if (publishers.twitter) {
                try {
                    const twitterUrl = await publishers.twitter.publishPost(postContent, substackUrl);
                    db.markPostPublished(postToPublish.id, 'twitter', twitterUrl);
                    await db.save();
                } catch (error) {
                    console.error(`❌ Twitter publish failed: ${error.message}`);
                    db.logError(postToPublish.id, 'twitter', error);
                    await db.save();
                }
            }
            
            // Wait between posts to avoid rate limits
            if (postsToPublish.indexOf(postToPublish) < postsToPublish.length - 1) {
                console.log('\n⏳ Waiting 30 seconds before next post...\n');
                await new Promise(resolve => setTimeout(resolve, 30000));
            }
        }
        
        // Close browsers
        for (const publisher of Object.values(publishers)) {
            await publisher.close();
        }
        
        // Display final stats
        console.log('\n' + '='.repeat(70));
        console.log('PUBLICATION COMPLETE');
        console.log('='.repeat(70));
        
        const stats = db.getPostingStats();
        console.log(`\n📊 Posting Statistics:`);
        console.log(`   Total posts: ${stats.totalPosts}`);
        console.log(`   Total publications: ${stats.totalPublications}`);
        console.log(`   Total failures: ${stats.totalFailures}`);
        console.log(`\n📈 Post Status:`);
        stats.byPost.forEach(post => {
            console.log(`   Post ${post.postNumber}: ${post.title}`);
            console.log(`      Posted ${post.postCount} times, last: ${post.lastPosted || 'Never'}`);
        });
        
        console.log(`\n✅ Done! Published ${postsToPublish.length} posts to ${CONFIG.platforms.join(' and ')}`);
        
    } catch (error) {
        console.error(`\n❌ Fatal error: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the script
main();
