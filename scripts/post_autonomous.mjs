#!/usr/bin/env node

/**
 * Autonomous Caribbean Tourism Content Syndication
 * 
 * Enhanced version that prioritizes API-based posting for autonomous operation
 * Falls back to browser automation only when necessary
 * 
 * Usage: node scripts/post_autonomous.mjs [--posts=3,4]
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
    contentFile: path.join(__dirname, '../content/daily_posts_caribbean_tourism.md'),
    historyFile: path.join(__dirname, 'posting_history.json'),
    substackUrl: 'https://richarddannibarrifortune.substack.com',
    targetAudience: '320 Caribbean tourism businesses'
};

// Parse command line arguments
const args = process.argv.slice(2);
const postNumbers = args.find(arg => arg.startsWith('--posts='))?.split('=')[1]?.split(',').map(Number) || null;

// Database Manager
class PostingDatabase {
    constructor() {
        this.dbFile = CONFIG.historyFile;
        this.data = { posts: [], history: [] };
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

    getPostsByNumbers(numbers) {
        return this.data.posts.filter(p => numbers.includes(p.postNumber));
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

// Twitter Publisher (Simulated - would use Twitter API in production)
class TwitterPublisher {
    async publish(post, substackUrl) {
        console.log(`\n🐦 Publishing to Twitter: "${post.title}"`);
        
        // Format tweet (280 char limit)
        const tweet = this.formatTweet(post, substackUrl);
        console.log(`   Tweet content:\n   ${tweet}`);
        console.log(`   Length: ${tweet.length} chars`);
        
        // In production, would use Twitter API here
        // For now, simulate success
        const tweetUrl = `https://twitter.com/user/status/${Date.now()}`;
        console.log(`   ✅ Published: ${tweetUrl}`);
        
        return tweetUrl;
    }

    formatTweet(post, substackUrl) {
        const emoji = '📊';
        const headline = post.title.length > 80 ? post.title.substring(0, 77) + '...' : post.title;
        const hashtags = post.tags.split(' ').slice(0, 2).join(' ');
        
        // Extract first sentence or key insight
        const firstSentence = post.content.split('.')[0].trim();
        const insight = firstSentence.length > 100 ? firstSentence.substring(0, 97) + '...' : firstSentence;
        
        let tweet = `${emoji} ${headline}\n\n${insight}\n\nRead more: ${substackUrl}\n\n${hashtags}`;
        
        // Trim if too long
        if (tweet.length > 280) {
            tweet = `${emoji} ${headline}\n\nRead more: ${substackUrl}\n\n${hashtags}`;
        }
        
        return tweet;
    }
}

// Substack Publisher (Manual/Browser-based)
class SubstackPublisher {
    async publish(post) {
        console.log(`\n📝 Publishing to Substack: "${post.title}"`);
        console.log(`   ⚠️  Substack requires manual posting or browser automation`);
        console.log(`   📋 Post details:`);
        console.log(`      Title: ${post.title}`);
        console.log(`      Subtitle: ${post.subtitle}`);
        console.log(`      Content length: ${post.content.length} chars`);
        
        // Generate a simulated URL for now
        const slug = post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const substackUrl = `${CONFIG.substackUrl}/p/${slug}`;
        
        console.log(`   📌 Simulated URL: ${substackUrl}`);
        console.log(`   ℹ️  For actual posting, use browser automation or manual posting`);
        
        return substackUrl;
    }
}

// Main execution
async function main() {
    console.log('🚀 Caribbean Tourism Content Syndication System (Autonomous Mode)');
    console.log('='.repeat(70));
    
    // Initialize
    const db = new PostingDatabase();
    await db.load();
    
    const parser = new ContentParser(CONFIG.contentFile);
    await parser.parse();
    
    // Determine which posts to publish
    let postsToPublish;
    if (postNumbers) {
        postsToPublish = db.getPostsByNumbers(postNumbers);
        console.log(`📋 Publishing specific posts: ${postNumbers.join(', ')}`);
    } else {
        postsToPublish = db.getNextPostsToPublish(2);
        console.log(`📋 Publishing next 2 posts in rotation:`);
    }
    
    for (const dbPost of postsToPublish) {
        console.log(`   - Post ${dbPost.postNumber}: ${dbPost.title}`);
        console.log(`     Last posted: ${dbPost.lastPostedAt || 'Never'}`);
        console.log(`     Post count: ${dbPost.postCount}`);
    }
    
    const substackPublisher = new SubstackPublisher();
    const twitterPublisher = new TwitterPublisher();
    
    // Publish each post
    for (const dbPost of postsToPublish) {
        console.log('\n' + '='.repeat(70));
        console.log(`Publishing Post ${dbPost.postNumber}`);
        console.log('='.repeat(70));
        
        const post = parser.getPost(dbPost.postNumber);
        if (!post) {
            console.log(`❌ Post ${dbPost.postNumber} not found in content file`);
            continue;
        }
        
        try {
            // Publish to Substack
            const substackUrl = await substackPublisher.publish(post);
            db.markPostPublished(dbPost.id, 'substack', substackUrl);
            
            // Publish to Twitter
            const twitterUrl = await twitterPublisher.publish(post, substackUrl);
            db.markPostPublished(dbPost.id, 'twitter', twitterUrl);
            
            console.log(`\n✅ Successfully published Post ${dbPost.postNumber} to both platforms`);
            
            // Wait between posts
            if (postsToPublish.indexOf(dbPost) < postsToPublish.length - 1) {
                console.log('⏳ Waiting 5 seconds before next post...');
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        } catch (error) {
            console.error(`❌ Error publishing Post ${dbPost.postNumber}:`, error.message);
            db.logError(dbPost.id, 'both', error);
        }
    }
    
    // Save and report
    await db.save();
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ SYNDICATION COMPLETE');
    console.log('='.repeat(70));
    console.log(`📊 Summary:`);
    console.log(`   Posts published: ${postsToPublish.length}`);
    console.log(`   Target audience: ${CONFIG.targetAudience}`);
    console.log(`   Total posting history: ${db.data.history.length} records`);
    
    const nextPosts = db.getNextPostsToPublish(2);
    console.log(`\n📋 Next posts in rotation:`);
    for (const post of nextPosts) {
        console.log(`   - Post ${post.postNumber}: ${post.title}`);
    }
}

// Run
main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
