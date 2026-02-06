#!/usr/bin/env node

/**
 * Caribbean Tourism Content Posting Script - Immediate Execution
 * 
 * Posts the next 2 Caribbean tourism articles to Substack and Twitter
 * Uses rotation logic to avoid duplicates and track posting history
 * 
 * Usage: 
 *   node scripts/post_now.mjs              # Post next 2 articles
 *   node scripts/post_now.mjs --dry-run    # Test without posting
 *   node scripts/post_now.mjs --count=1    # Post only 1 article
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
    historyFile: path.join(__dirname, 'posting_history.json'),
    substackSessionFile: path.join(process.env.HOME, '.substack-session.json'),
    twitterSessionFile: path.join(process.env.HOME, '.twitter-session.json'),
    substackUrl: 'https://richarddannibarrifortune.substack.com',
    twitterUrl: 'https://x.com',
    headless: process.env.HEADLESS !== 'false',
    timeout: 60000,
    dryRun: process.argv.includes('--dry-run'),
    postCount: parseInt(process.argv.find(arg => arg.startsWith('--count='))?.split('=')[1] || '2'),
    targetAudience: '320 Caribbean tourism businesses'
};

// ============================================================================
// CONTENT PARSER
// ============================================================================
class ContentParser {
    async parseContent() {
        const content = await fs.readFile(CONFIG.contentFile, 'utf-8');
        const posts = [];
        
        // Split by post markers
        const postRegex = /## Post (\d+):(.*?)\n\n\*\*Title:\*\*(.*?)\n\n\*\*Subtitle:\*\*(.*?)\n\n\*\*Content:\*\*(.*?)(?=\n\n\*\*Sources:|## Post \d+:|$)/gs;
        
        let match;
        while ((match = postRegex.exec(content)) !== null) {
            const postNumber = parseInt(match[1]);
            const postTitle = match[2].trim();
            const title = match[3].trim();
            const subtitle = match[4].trim();
            let postContent = match[5].trim();
            
            // Extract sources and tags
            const sourcesMatch = content.match(new RegExp(`## Post ${postNumber}:.*?\\*\\*Sources:\\*\\*([^\\n]+)`, 's'));
            const tagsMatch = content.match(new RegExp(`## Post ${postNumber}:.*?\\*\\*Tags:\\*\\*([^\\n]+)`, 's'));
            
            const sources = sourcesMatch ? sourcesMatch[1].trim() : '';
            const tags = tagsMatch ? tagsMatch[1].trim() : '';
            
            posts.push({
                id: postNumber,
                postNumber,
                postTitle,
                title,
                subtitle,
                content: postContent,
                sources,
                tags
            });
        }
        
        console.log(`📄 Parsed ${posts.length} posts from content file`);
        return posts;
    }
}

// ============================================================================
// POSTING DATABASE
// ============================================================================
class PostingDatabase {
    constructor() {
        this.data = {
            posts: [],
            history: []
        };
    }

    async load() {
        try {
            const content = await fs.readFile(CONFIG.historyFile, 'utf-8');
            this.data = JSON.parse(content);
            console.log(`📊 Loaded posting history: ${this.data.history.length} records`);
        } catch (error) {
            console.log('📊 No existing posting history, initializing...');
            await this.initialize();
        }
    }

    async save() {
        await fs.writeFile(CONFIG.historyFile, JSON.stringify(this.data, null, 2));
        console.log('💾 Saved posting history');
    }

    async initialize() {
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
            // Never posted takes priority
            if (a.lastPostedAt === null && b.lastPostedAt !== null) return -1;
            if (a.lastPostedAt !== null && b.lastPostedAt === null) return 1;
            
            // Then by post count (least posted first)
            if (a.postCount !== b.postCount) return a.postCount - b.postCount;
            
            // Then by oldest last posted date
            if (a.lastPostedAt && b.lastPostedAt) {
                return new Date(a.lastPostedAt) - new Date(b.lastPostedAt);
            }
            
            // Finally by post number
            return a.postNumber - b.postNumber;
        });
        
        return sorted.slice(0, count);
    }

    async recordPost(postId, platform, url, status = 'success') {
        const post = this.data.posts.find(p => p.id === postId);
        if (!post) return;
        
        // Update post metadata
        post.lastPostedAt = new Date().toISOString();
        post.postCount += 1;
        
        if (platform === 'substack') post.substackUrl = url;
        if (platform === 'twitter') post.twitterUrl = url;
        
        // Add to history
        this.data.history.push({
            postId,
            platform,
            url,
            status,
            postedAt: new Date().toISOString()
        });
        
        await this.save();
    }
}

// ============================================================================
// SUBSTACK POSTER
// ============================================================================
class SubstackPoster {
    async post(article) {
        console.log(`\n📝 Posting to Substack: "${article.title}"`);
        
        if (CONFIG.dryRun) {
            const dryRunUrl = `https://richarddannibarrifortune.substack.com/p/${this.slugify(article.title)}`;
            console.log(`✅ [DRY RUN] Would post to Substack: ${dryRunUrl}`);
            return dryRunUrl;
        }
        
        const browser = await chromium.launch({ headless: CONFIG.headless });
        const context = await browser.newContext();
        
        try {
            // Load session if available
            try {
                const cookies = JSON.parse(await fs.readFile(CONFIG.substackSessionFile, 'utf-8'));
                await context.addCookies(cookies);
                console.log('🔐 Loaded Substack session');
            } catch (error) {
                console.log('⚠️  No Substack session found, proceeding without login');
            }
            
            const page = await context.newPage();
            
            // Navigate to publish page
            await page.goto(`${CONFIG.substackUrl}/publish/home`, { waitUntil: 'networkidle' });
            
            // Check if logged in
            const isLoggedIn = await page.locator('button:has-text("New post")').isVisible().catch(() => false);
            
            if (!isLoggedIn) {
                console.log('❌ Not logged in to Substack. Please run: node scripts/setup_sessions.mjs');
                throw new Error('Substack login required');
            }
            
            // Click "New post"
            await page.click('button:has-text("New post")');
            await page.waitForTimeout(2000);
            
            // Fill in title
            await page.fill('[placeholder="Title"]', article.title);
            await page.waitForTimeout(500);
            
            // Fill in subtitle if exists
            if (article.subtitle) {
                await page.fill('[placeholder="Subtitle"]', article.subtitle);
                await page.waitForTimeout(500);
            }
            
            // Fill in content
            const contentArea = page.locator('.ProseMirror').first();
            await contentArea.click();
            await contentArea.fill(article.content);
            await page.waitForTimeout(1000);
            
            // Click publish
            await page.click('button:has-text("Publish")');
            await page.waitForTimeout(2000);
            
            // Confirm publish
            await page.click('button:has-text("Publish now")');
            await page.waitForTimeout(5000);
            
            // Get published URL
            const url = page.url();
            console.log(`✅ Posted to Substack: ${url}`);
            
            return url;
            
        } catch (error) {
            console.error(`❌ Substack posting failed: ${error.message}`);
            throw error;
        } finally {
            await browser.close();
        }
    }
    
    slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
}

// ============================================================================
// TWITTER POSTER
// ============================================================================
class TwitterPoster {
    async post(article, substackUrl) {
        console.log(`\n🐦 Posting to Twitter: "${article.title}"`);
        
        // Format tweet (280 char limit)
        const tweet = this.formatTweet(article, substackUrl);
        
        if (CONFIG.dryRun) {
            const dryRunUrl = `https://x.com/user/status/dry-run-${article.postNumber}`;
            console.log(`✅ [DRY RUN] Would post to Twitter:`);
            console.log(`   ${tweet}`);
            console.log(`   URL: ${dryRunUrl}`);
            return dryRunUrl;
        }
        
        const browser = await chromium.launch({ headless: CONFIG.headless });
        const context = await browser.newContext();
        
        try {
            // Load session if available
            try {
                const cookies = JSON.parse(await fs.readFile(CONFIG.twitterSessionFile, 'utf-8'));
                await context.addCookies(cookies);
                console.log('🔐 Loaded Twitter session');
            } catch (error) {
                console.log('⚠️  No Twitter session found, proceeding without login');
            }
            
            const page = await context.newPage();
            
            // Navigate to Twitter
            await page.goto(`${CONFIG.twitterUrl}/compose/tweet`, { waitUntil: 'networkidle' });
            
            // Check if logged in
            const isLoggedIn = await page.locator('[data-testid="tweetTextarea_0"]').isVisible().catch(() => false);
            
            if (!isLoggedIn) {
                console.log('❌ Not logged in to Twitter. Please run: node scripts/setup_sessions.mjs');
                throw new Error('Twitter login required');
            }
            
            // Fill tweet
            await page.fill('[data-testid="tweetTextarea_0"]', tweet);
            await page.waitForTimeout(1000);
            
            // Click tweet button
            await page.click('[data-testid="tweetButtonInline"]');
            await page.waitForTimeout(3000);
            
            // Get tweet URL
            const url = page.url();
            console.log(`✅ Posted to Twitter: ${url}`);
            
            return url;
            
        } catch (error) {
            console.error(`❌ Twitter posting failed: ${error.message}`);
            throw error;
        } finally {
            await browser.close();
        }
    }
    
    formatTweet(article, substackUrl) {
        // Extract first key point from content
        const contentLines = article.content.split('\n').filter(line => line.trim());
        const firstPoint = contentLines.find(line => line.length > 50 && line.length < 200) || contentLines[0];
        
        // Format: Title + Brief insight + Link + Hashtags
        let tweet = `${article.title}\n\n${firstPoint.substring(0, 150)}...\n\n`;
        
        if (substackUrl) {
            tweet += `Read more: ${substackUrl}\n\n`;
        }
        
        // Add hashtags (extract from tags)
        const hashtags = article.tags
            .split('#')
            .filter(tag => tag.trim())
            .slice(0, 2)
            .map(tag => `#${tag.trim().split(' ')[0]}`)
            .join(' ');
        
        tweet += hashtags;
        
        // Ensure under 280 chars
        if (tweet.length > 280) {
            tweet = tweet.substring(0, 277) + '...';
        }
        
        return tweet;
    }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================
async function main() {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║   Caribbean Tourism Content Syndication                       ║');
    console.log('║   WUKR Wire Daily Dispatch                                    ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    if (CONFIG.dryRun) {
        console.log('🧪 DRY RUN MODE - No actual posting will occur\n');
    }
    
    // Initialize components
    const parser = new ContentParser();
    const database = new PostingDatabase();
    const substackPoster = new SubstackPoster();
    const twitterPoster = new TwitterPoster();
    
    // Load data
    await database.load();
    const allPosts = await parser.parseContent();
    
    // Get next posts to publish
    const nextPosts = database.getNextPostsToPublish(CONFIG.postCount);
    
    console.log(`\n📋 Next ${CONFIG.postCount} posts to publish:`);
    nextPosts.forEach(post => {
        console.log(`   ${post.postNumber}. ${post.title} (posted ${post.postCount} times)`);
    });
    
    console.log(`\n🎯 Target audience: ${CONFIG.targetAudience}`);
    console.log(`📅 Posting at: ${new Date().toLocaleString('en-US', { timeZone: 'America/Puerto_Rico' })} AST\n`);
    
    // Post each article
    for (const postMeta of nextPosts) {
        const article = allPosts.find(p => p.postNumber === postMeta.postNumber);
        
        if (!article) {
            console.log(`⚠️  Post ${postMeta.postNumber} not found in content file, skipping`);
            continue;
        }
        
        console.log(`\n${'='.repeat(70)}`);
        console.log(`📢 Publishing Post ${article.postNumber}: ${article.title}`);
        console.log('='.repeat(70));
        
        try {
            // Post to Substack
            const substackUrl = await substackPoster.post(article);
            await database.recordPost(article.postNumber, 'substack', substackUrl, 'success');
            
            // Wait between posts
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Post to Twitter
            const twitterUrl = await twitterPoster.post(article, substackUrl);
            await database.recordPost(article.postNumber, 'twitter', twitterUrl, 'success');
            
            console.log(`\n✅ Successfully published Post ${article.postNumber} to both platforms`);
            
            // Wait between articles
            if (nextPosts.indexOf(postMeta) < nextPosts.length - 1) {
                console.log('\n⏳ Waiting 10 seconds before next post...');
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
            
        } catch (error) {
            console.error(`\n❌ Failed to publish Post ${article.postNumber}: ${error.message}`);
            await database.recordPost(article.postNumber, 'error', '', 'failed');
        }
    }
    
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║   Posting Complete                                            ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    // Show summary
    const summary = database.data.posts.map(p => ({
        post: p.postNumber,
        count: p.postCount,
        lastPosted: p.lastPostedAt ? new Date(p.lastPostedAt).toLocaleString() : 'Never'
    }));
    
    console.table(summary);
    
    console.log('\n📊 Total posts in history:', database.data.history.length);
    console.log('✅ Session complete\n');
}

main().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
});
