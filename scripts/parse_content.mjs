#!/usr/bin/env node

/**
 * Content Parser for Caribbean Tourism Posts
 * Extracts structured post data from the markdown file
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_FILE = path.join(__dirname, '../content/daily_posts_caribbean_tourism.md');

/**
 * Parse the markdown file and extract all posts
 */
async function parseContent() {
    const content = await fs.readFile(CONTENT_FILE, 'utf-8');
    const posts = [];
    
    // Split by post markers
    const postSections = content.split(/^## Post \d+:/gm).slice(1);
    
    for (let i = 0; i < postSections.length; i++) {
        const section = postSections[i];
        const postNumber = i + 1;
        
        // Extract title
        const titleMatch = section.match(/\*\*Title:\*\* (.+)/);
        const title = titleMatch ? titleMatch[1].trim() : `Post ${postNumber}`;
        
        // Extract subtitle
        const subtitleMatch = section.match(/\*\*Subtitle:\*\* (.+)/);
        const subtitle = subtitleMatch ? subtitleMatch[1].trim() : null;
        
        // Extract content (everything between **Content:** and **Sources:**)
        const contentMatch = section.match(/\*\*Content:\*\*\s+([\s\S]+?)\s+\*\*Sources:\*\*/);
        const fullContent = contentMatch ? contentMatch[1].trim() : '';
        
        // Extract sources
        const sourcesMatch = section.match(/\*\*Sources:\*\* (.+)/);
        const sources = sourcesMatch ? sourcesMatch[1].trim() : '';
        
        // Extract tags
        const tagsMatch = section.match(/\*\*Tags:\*\* (.+)/);
        const tagsStr = tagsMatch ? tagsMatch[1].trim() : '';
        const tags = tagsStr.split(/\s+/).filter(t => t.startsWith('#'));
        
        posts.push({
            postNumber,
            title,
            subtitle,
            content: fullContent,
            sources,
            tags,
            // Generate Twitter-friendly version (280 chars max)
            twitterContent: generateTwitterContent(title, subtitle, tags)
        });
    }
    
    return posts;
}

/**
 * Generate Twitter-friendly content (under 280 characters)
 */
function generateTwitterContent(title, subtitle, tags) {
    const emoji = '🌴';
    const hashtags = tags.slice(0, 2).join(' '); // Use first 2 hashtags
    
    // Build tweet
    let tweet = `${emoji} ${title}`;
    
    if (subtitle) {
        const remaining = 280 - tweet.length - hashtags.length - 5; // 5 for spacing
        if (subtitle.length <= remaining) {
            tweet += `\n\n${subtitle}`;
        }
    }
    
    tweet += `\n\n${hashtags}`;
    
    // Ensure under 280 chars
    if (tweet.length > 280) {
        // Truncate subtitle
        const maxSubtitle = 280 - tweet.length + subtitle.length - 3;
        const truncatedSubtitle = subtitle.substring(0, maxSubtitle) + '...';
        tweet = `${emoji} ${title}\n\n${truncatedSubtitle}\n\n${hashtags}`;
    }
    
    return tweet;
}

// If run directly, output JSON
if (import.meta.url === `file://${process.argv[1]}`) {
    const posts = await parseContent();
    console.log(JSON.stringify(posts, null, 2));
}

export { parseContent };
