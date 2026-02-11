#!/usr/bin/env node

/**
 * WUKR Wire Daily Dispatch - Base 44 to Substack & Twitter
 * 
 * Automated content syndication system that:
 * 1. Fetches latest processed content from Supabase (Base 44)
 * 2. Posts to Substack using browser automation
 * 3. Posts to Twitter with link to Substack article
 * 4. Updates database with published URLs
 * 5. Tracks posting history for duplicate prevention
 * 
 * Execution: node scripts/base44_to_substack.mjs [--dry-run] [--count=N] [--platform=substack,twitter]
 */

import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = 'https://ebrarmerpzlrbsfpmlkg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVicmFybWVycHpscmJzZnBtbGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Njk4NzgsImV4cCI6MjA4NjA0NTg3OH0.6o9DjnXLkleqaYSfnpNcSlOiiKC-QczOhwLswe8ku8U';

const SUBSTACK_URL = 'https://richarddannibarrifortune.substack.com';
const SUBSTACK_SESSION_FILE = path.join(process.env.HOME, '.substack-session.json');
const TWITTER_SESSION_FILE = path.join(process.env.HOME, '.twitter-session.json');

const HEADLESS = process.env.HEADLESS !== 'false';
const DRY_RUN = process.argv.includes('--dry-run');
const SETUP_LOGIN = process.argv.includes('--setup-login');

// Parse command line arguments
const countArg = process.argv.find(arg => arg.startsWith('--count='));
const COUNT = countArg ? parseInt(countArg.split('=')[1]) : 2;

const platformArg = process.argv.find(arg => arg.startsWith('--platform='));
const PLATFORMS = platformArg 
  ? platformArg.split('=')[1].split(',') 
  : ['substack', 'twitter'];

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    debug: '🔍'
  }[type] || 'ℹ️';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function validateDate() {
  const now = new Date();
  log(`Current date/time: ${now.toISOString()}`, 'debug');
  return now;
}

async function getNextPostsToPublish(count = 2) {
  log(`Fetching next ${count} posts to publish from database...`);
  
  const { data, error } = await supabase
    .from('caribbean_tourism_posts')
    .select('*')
    .order('lastpostedat', { ascending: true, nullsFirst: true })
    .order('postcount', { ascending: true })
    .order('postnumber', { ascending: true })
    .limit(count);
  
  if (error) {
    log(`Error fetching posts: ${error.message}`, 'error');
    throw error;
  }
  
  if (!data || data.length === 0) {
    log('No posts found in database. Need to initialize content first.', 'warning');
    return [];
  }
  
  log(`Found ${data.length} posts to publish`, 'success');
  return data;
}

async function markPostPublished(postId, platform, url) {
  log(`Marking post ${postId} as published on ${platform}...`);
  
  // Update post count and last posted time
  const { error: updateError } = await supabase
    .from('caribbean_tourism_posts')
    .update({
      lastpostedat: new Date().toISOString(),
      postcount: supabase.raw('postcount + 1'),
      updatedat: new Date().toISOString(),
      ...(platform === 'substack' && { substackurl: url }),
      ...(platform === 'twitter' && { twitterurl: url })
    })
    .eq('id', postId);
  
  if (updateError) {
    log(`Error updating post: ${updateError.message}`, 'error');
    throw updateError;
  }
  
  // Log to posting history
  const { error: historyError } = await supabase
    .from('posting_history')
    .insert({
      postid: postId,
      platform,
      posturl: url,
      status: 'success',
      postedat: new Date().toISOString()
    });
  
  if (historyError) {
    log(`Error logging to history: ${historyError.message}`, 'error');
    throw historyError;
  }
  
  log(`Successfully marked post ${postId} as published on ${platform}`, 'success');
}

async function logPostingError(postId, platform, errorMessage) {
  await supabase
    .from('posting_history')
    .insert({
      postid: postId,
      platform,
      status: 'failed',
      errormessage: errorMessage,
      postedat: new Date().toISOString()
    });
}

// ============================================================================
// BROWSER AUTOMATION - SUBSTACK
// ============================================================================

async function setupSubstackLogin() {
  log('Setting up Substack login session...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto(`${SUBSTACK_URL}/publish/home`);
  
  log('Please log in to Substack in the browser window...');
  log('Waiting 60 seconds for you to complete login...');
  
  await page.waitForTimeout(60000);
  
  // Save cookies
  const cookies = await context.cookies();
  fs.writeFileSync(SUBSTACK_SESSION_FILE, JSON.stringify(cookies, null, 2));
  
  log(`Session saved to ${SUBSTACK_SESSION_FILE}`, 'success');
  
  await browser.close();
}

async function postToSubstack(post) {
  log(`Posting to Substack: "${post.title}"`);
  
  if (!fs.existsSync(SUBSTACK_SESSION_FILE)) {
    throw new Error('No saved Substack session found. Run with --setup-login first.');
  }
  
  const cookies = JSON.parse(fs.readFileSync(SUBSTACK_SESSION_FILE, 'utf-8'));
  
  const browser = await chromium.launch({ headless: HEADLESS });
  const context = await browser.newContext();
  await context.addCookies(cookies);
  
  const page = await context.newPage();
  
  try {
    // Navigate to publish page
    await page.goto(`${SUBSTACK_URL}/publish/home`, { waitUntil: 'networkidle' });
    
    // Click "New post" button
    await page.click('button:has-text("New post"), a:has-text("New post")');
    await page.waitForTimeout(2000);
    
    // Fill in title
    await page.fill('textarea[placeholder*="Title"], input[placeholder*="Title"]', post.title);
    await page.waitForTimeout(1000);
    
    // Fill in subtitle if exists
    if (post.subtitle) {
      await page.fill('textarea[placeholder*="Subtitle"], input[placeholder*="Subtitle"]', post.subtitle);
      await page.waitForTimeout(1000);
    }
    
    // Fill in content
    const contentEditor = page.locator('.ProseMirror, [contenteditable="true"]').first();
    await contentEditor.click();
    await contentEditor.fill(post.content);
    await page.waitForTimeout(2000);
    
    // Click "Continue" or "Publish"
    await page.click('button:has-text("Continue"), button:has-text("Publish")');
    await page.waitForTimeout(3000);
    
    // Click "Publish now" or "Send to everyone now"
    await page.click('button:has-text("Publish now"), button:has-text("Send to everyone now")');
    await page.waitForTimeout(5000);
    
    // Get published URL
    const currentUrl = page.url();
    log(`Published to Substack: ${currentUrl}`, 'success');
    
    await browser.close();
    return currentUrl;
    
  } catch (error) {
    await browser.close();
    throw error;
  }
}

// ============================================================================
// BROWSER AUTOMATION - TWITTER
// ============================================================================

async function setupTwitterLogin() {
  log('Setting up Twitter login session...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('https://twitter.com/home');
  
  log('Please log in to Twitter in the browser window...');
  log('Waiting 60 seconds for you to complete login...');
  
  await page.waitForTimeout(60000);
  
  // Save cookies
  const cookies = await context.cookies();
  fs.writeFileSync(TWITTER_SESSION_FILE, JSON.stringify(cookies, null, 2));
  
  log(`Session saved to ${TWITTER_SESSION_FILE}`, 'success');
  
  await browser.close();
}

async function postToTwitter(post, substackUrl) {
  log(`Posting to Twitter: "${post.title}"`);
  
  if (!fs.existsSync(TWITTER_SESSION_FILE)) {
    throw new Error('No saved Twitter session found. Run with --setup-login first.');
  }
  
  const cookies = JSON.parse(fs.readFileSync(TWITTER_SESSION_FILE, 'utf-8'));
  
  const browser = await chromium.launch({ headless: HEADLESS });
  const context = await browser.newContext();
  await context.addCookies(cookies);
  
  const page = await context.newPage();
  
  try {
    await page.goto('https://twitter.com/home', { waitUntil: 'networkidle' });
    
    // Extract hashtags from tags array
    const hashtags = post.tags ? post.tags.slice(0, 2).join(' ') : '';
    
    // Compose tweet (max 280 characters)
    const tweetText = `🌴 ${post.title}

${post.subtitle || ''}

Read more: ${substackUrl}

WUKR Wire Intelligence
${hashtags}`.trim();
    
    // Truncate if needed
    const finalTweet = tweetText.length > 280 
      ? tweetText.substring(0, 277) + '...' 
      : tweetText;
    
    // Click tweet compose box
    await page.click('[data-testid="tweetTextarea_0"]');
    await page.waitForTimeout(1000);
    
    // Type tweet
    await page.fill('[data-testid="tweetTextarea_0"]', finalTweet);
    await page.waitForTimeout(2000);
    
    // Click tweet button
    await page.click('[data-testid="tweetButtonInline"]');
    await page.waitForTimeout(5000);
    
    // Get tweet URL (approximate)
    const tweetUrl = 'https://twitter.com/compose/tweet';
    log(`Posted to Twitter`, 'success');
    
    await browser.close();
    return tweetUrl;
    
  } catch (error) {
    await browser.close();
    throw error;
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  log('=== WUKR Wire Daily Dispatch ===');
  log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`, DRY_RUN ? 'warning' : 'info');
  log(`Platforms: ${PLATFORMS.join(', ')}`);
  log(`Posts to publish: ${COUNT}`);
  
  // Validate date/time
  validateDate();
  
  // Handle setup login
  if (SETUP_LOGIN) {
    const platformArg = process.argv.find(arg => arg.startsWith('--platform='));
    const platform = platformArg ? platformArg.split('=')[1] : 'substack';
    
    if (platform === 'substack') {
      await setupSubstackLogin();
    } else if (platform === 'twitter') {
      await setupTwitterLogin();
    }
    
    return;
  }
  
  // Fetch posts to publish
  const posts = await getNextPostsToPublish(COUNT);
  
  if (posts.length === 0) {
    log('No posts available to publish', 'warning');
    return;
  }
  
  // Process each post
  for (const post of posts) {
    log(`\n--- Processing Post ${post.postnumber}: ${post.title} ---`);
    
    if (DRY_RUN) {
      log('DRY RUN: Would post to platforms', 'warning');
      log(`Title: ${post.title}`);
      log(`Subtitle: ${post.subtitle || 'N/A'}`);
      log(`Content length: ${post.content.length} characters`);
      log(`Last posted: ${post.lastpostedat || 'Never'}`);
      log(`Post count: ${post.postcount}`);
      continue;
    }
    
    let substackUrl = post.substackurl;
    let twitterUrl = post.twitterurl;
    
    // Post to Substack
    if (PLATFORMS.includes('substack') && !substackUrl) {
      try {
        substackUrl = await postToSubstack(post);
        await markPostPublished(post.id, 'substack', substackUrl);
      } catch (error) {
        log(`Failed to post to Substack: ${error.message}`, 'error');
        await logPostingError(post.id, 'substack', error.message);
      }
    }
    
    // Post to Twitter
    if (PLATFORMS.includes('twitter') && substackUrl) {
      try {
        twitterUrl = await postToTwitter(post, substackUrl);
        await markPostPublished(post.id, 'twitter', twitterUrl);
      } catch (error) {
        log(`Failed to post to Twitter: ${error.message}`, 'error');
        await logPostingError(post.id, 'twitter', error.message);
      }
    }
    
    log(`Post ${post.postnumber} processing complete`, 'success');
  }
  
  log('\n=== Posting Summary ===');
  log(`Total posts processed: ${posts.length}`);
  log('Dispatch complete!', 'success');
}

// Run main function
main().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
