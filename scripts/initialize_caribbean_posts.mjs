#!/usr/bin/env node

/**
 * Initialize Caribbean Tourism Posts in Supabase
 * 
 * Parses the daily_posts_caribbean_tourism.md file and populates
 * the caribbean_tourism_posts table with the 6 posts.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const SUPABASE_URL = 'https://ebrarmerpzlrbsfpmlkg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVicmFybWVycHpscmJzZnBtbGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Njk4NzgsImV4cCI6MjA4NjA0NTg3OH0.6o9DjnXLkleqaYSfnpNcSlOiiKC-QczOhwLswe8ku8U';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CONTENT_FILE = path.join(__dirname, '../content/daily_posts_caribbean_tourism.md');

function log(message, type = 'info') {
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  }[type] || 'ℹ️';
  console.log(`${prefix} ${message}`);
}

function parseContentFile() {
  log('Parsing content file...');
  
  const content = fs.readFileSync(CONTENT_FILE, 'utf-8');
  const posts = [];
  
  // Split by post sections
  const postSections = content.split(/## Post \d+:/);
  
  for (let i = 1; i < postSections.length; i++) {
    const section = postSections[i];
    
    // Extract title
    const titleMatch = section.match(/\*\*Title:\*\* (.+)/);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    // Extract subtitle
    const subtitleMatch = section.match(/\*\*Subtitle:\*\* (.+)/);
    const subtitle = subtitleMatch ? subtitleMatch[1].trim() : '';
    
    // Extract content (everything between **Content:** and **Tags:**)
    const contentMatch = section.match(/\*\*Content:\*\*([\s\S]+?)\*\*(?:Sources|Tags):/);
    const postContent = contentMatch ? contentMatch[1].trim() : '';
    
    // Extract tags
    const tagsMatch = section.match(/\*\*Tags:\*\* (.+)/);
    const tagsString = tagsMatch ? tagsMatch[1].trim() : '';
    const tags = tagsString.split(/\s+/).filter(tag => tag.startsWith('#'));
    
    if (title && postContent) {
      posts.push({
        postnumber: i,
        title,
        subtitle,
        content: postContent,
        tags,
        targetaudience: 'Caribbean tourism businesses'
      });
    }
  }
  
  log(`Parsed ${posts.length} posts from content file`, 'success');
  return posts;
}

async function initializePosts() {
  log('Initializing Caribbean tourism posts in database...');
  
  const posts = parseContentFile();
  
  if (posts.length === 0) {
    log('No posts found to initialize', 'error');
    return;
  }
  
  // Check if posts already exist
  const { data: existingPosts } = await supabase
    .from('caribbean_tourism_posts')
    .select('postnumber');
  
  if (existingPosts && existingPosts.length > 0) {
    log(`Found ${existingPosts.length} existing posts in database`, 'warning');
    log('Deleting existing posts to reinitialize...');
    
    const { error: deleteError } = await supabase
      .from('caribbean_tourism_posts')
      .delete()
      .neq('id', 0); // Delete all
    
    if (deleteError) {
      log(`Error deleting existing posts: ${deleteError.message}`, 'error');
      return;
    }
  }
  
  // Insert posts
  log(`Inserting ${posts.length} posts into database...`);
  
  const { data, error } = await supabase
    .from('caribbean_tourism_posts')
    .insert(posts)
    .select();
  
  if (error) {
    log(`Error inserting posts: ${error.message}`, 'error');
    throw error;
  }
  
  log(`Successfully initialized ${data.length} posts`, 'success');
  
  // Display summary
  console.log('\n=== Posts Initialized ===');
  for (const post of data) {
    console.log(`Post ${post.postnumber}: ${post.title}`);
    console.log(`  Subtitle: ${post.subtitle || 'N/A'}`);
    console.log(`  Content length: ${post.content.length} characters`);
    console.log(`  Tags: ${post.tags.join(', ')}`);
    console.log('');
  }
}

// Run initialization
initializePosts().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
