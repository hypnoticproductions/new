#!/usr/bin/env node

/**
 * Initialize Posting Database with Caribbean Tourism Posts
 * 
 * Parses the 6 posts from daily_posts_caribbean_tourism.md and creates
 * a JSON database for tracking posting history and rotation.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
    contentFile: path.join(__dirname, '../content/daily_posts_caribbean_tourism.md'),
    dbFile: path.join(__dirname, 'posting_history.json')
};

async function parseContentFile() {
    console.log('📖 Reading content file...');
    const content = await fs.readFile(CONFIG.contentFile, 'utf-8');
    
    const posts = [];
    const postRegex = /## Post (\d+): (.+?)\n\n\*\*Title:\*\* (.+?)\n\n\*\*Subtitle:\*\* (.+?)\n\n\*\*Content:\*\*\n\n([\s\S]+?)(?=\n---\n\n(?:## Post|\*\*End)|$)/g;
    
    let match;
    while ((match = postRegex.exec(content)) !== null) {
        const [, num, topic, title, subtitle, body] = match;
        const tagsMatch = body.match(/\*\*Tags:\*\* (.+?)$/m);
        const tags = tagsMatch ? tagsMatch[1].split(' ').filter(t => t.startsWith('#')) : [];
        
        posts.push({
            id: parseInt(num),
            postNumber: parseInt(num),
            topic,
            title,
            subtitle,
            content: body.trim(),
            tags,
            targetAudience: '320 Caribbean tourism businesses',
            lastPostedAt: null,
            postCount: 0,
            substackUrl: null,
            twitterUrl: null,
            linkedinUrl: null,
            hashnodeUrl: null,
            devtoUrl: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }
    
    console.log(`✅ Parsed ${posts.length} posts`);
    return posts;
}

async function initializeDatabase() {
    try {
        // Check if database already exists
        let existingData = null;
        try {
            const existing = await fs.readFile(CONFIG.dbFile, 'utf-8');
            existingData = JSON.parse(existing);
            console.log('📊 Found existing database');
        } catch (error) {
            console.log('📊 No existing database found, creating new one');
        }
        
        // Parse posts from content file
        const posts = await parseContentFile();
        
        // Preserve history if it exists
        const history = existingData?.history || [];
        
        // If we have existing posts, preserve their posting stats
        if (existingData?.posts) {
            posts.forEach(post => {
                const existing = existingData.posts.find(p => p.postNumber === post.postNumber);
                if (existing) {
                    post.lastPostedAt = existing.lastPostedAt;
                    post.postCount = existing.postCount;
                    post.substackUrl = existing.substackUrl || null;
                    post.twitterUrl = existing.twitterUrl || null;
                    post.linkedinUrl = existing.linkedinUrl || null;
                    post.hashnodeUrl = existing.hashnodeUrl || null;
                    post.devtoUrl = existing.devtoUrl || null;
                }
            });
        }
        
        // Create database structure
        const database = {
            posts,
            history,
            schedule: {
                timezone: 'America/Puerto_Rico', // AST
                slots: [
                    { time: '09:00', postsPerSlot: 2, description: 'Morning post (Posts 1-2)' },
                    { time: '13:00', postsPerSlot: 2, description: 'Afternoon post (Posts 3-4)' },
                    { time: '18:00', postsPerSlot: 2, description: 'Evening post (Posts 5-6)' }
                ]
            },
            platforms: {
                substack: { enabled: true, sessionValid: false },
                twitter: { enabled: true, sessionValid: false },
                linkedin: { enabled: false, sessionValid: false },
                hashnode: { enabled: false, sessionValid: false },
                devto: { enabled: false, sessionValid: false }
            },
            metadata: {
                targetAudience: '320 Caribbean tourism businesses',
                contentSource: 'daily_posts_caribbean_tourism.md',
                lastUpdated: new Date().toISOString(),
                version: '1.0'
            }
        };
        
        // Save database
        await fs.writeFile(CONFIG.dbFile, JSON.stringify(database, null, 2));
        console.log('💾 Database initialized successfully');
        console.log(`   Posts: ${database.posts.length}`);
        console.log(`   History records: ${database.history.length}`);
        console.log(`   File: ${CONFIG.dbFile}`);
        
        // Display post summary
        console.log('\n📋 Posts Summary:');
        database.posts.forEach(post => {
            console.log(`   Post ${post.postNumber}: ${post.title}`);
            console.log(`      Topic: ${post.topic}`);
            console.log(`      Posted: ${post.postCount} times`);
            console.log(`      Last posted: ${post.lastPostedAt || 'Never'}`);
        });
        
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        process.exit(1);
    }
}

// Run initialization
initializeDatabase();
