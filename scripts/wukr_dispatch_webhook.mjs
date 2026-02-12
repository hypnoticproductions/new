#!/usr/bin/env node

/**
 * WUKR Wire Unified Dispatch Webhook
 * 
 * Handles automated content syndication triggered by cron-job.org:
 * 1. Base 44 to Substack (7:00 AM AST) - Posts latest processed_content
 * 2. Caribbean Tourism Rotation (9 AM, 1 PM, 6 PM AST) - Posts 2 articles per slot
 * 
 * Execution: node scripts/wukr_dispatch_webhook.mjs --task=<task_name> [--dry-run]
 * 
 * Tasks:
 * - base44_dispatch: Post latest Base 44 content to Substack
 * - caribbean_9am: Post 2 Caribbean tourism articles (9 AM slot)
 * - caribbean_1pm: Post 2 Caribbean tourism articles (1 PM slot)
 * - caribbean_6pm: Post 2 Caribbean tourism articles (6 PM slot)
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

// Parse task argument
const taskArg = process.argv.find(arg => arg.startsWith('--task='));
const TASK = taskArg ? taskArg.split('=')[1] : null;

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================================
// LOGGING
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

function validateDateTime() {
  const now = new Date();
  const ast = new Date(now.toLocaleString('en-US', { timeZone: 'America/Puerto_Rico' }));
  log(`Current UTC: ${now.toISOString()}`, 'debug');
  log(`Current AST: ${ast.toLocaleString()}`, 'debug');
  return { utc: now, ast };
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

async function getCaribbeanPosts(count = 2) {
  log(`Fetching next ${count} Caribbean tourism posts...`);
  
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
    log('No Caribbean tourism posts found in database', 'warning');
    return [];
  }
  
  log(`Found ${data.length} Caribbean tourism posts to publish`, 'success');
  return data;
}

async function getLatestBase44Content() {
  log('Fetching latest Base 44 content...');
  
  const { data, error } = await supabase
    .from('processed_content')
    .select('*')
    .is('substackurl', null)
    .order('createdat', { ascending: false })
    .limit(1);
  
  if (error) {
    log(`Error fetching Base 44 content: ${error.message}`, 'error');
    throw error;
  }
  
  if (!data || data.length === 0) {
    log('No new Base 44 content to publish', 'info');
    return null;
  }
  
  log(`Found Base 44 content: "${data[0].title}"`, 'success');
  return data[0];
}

async function markPostPublished(postId, platform, url, tableName = 'caribbean_tourism_posts') {
  log(`Marking post ${postId} as published on ${platform}...`);
  
  const updateData = {
    lastpostedat: new Date().toISOString(),
    updatedat: new Date().toISOString()
  };
  
  if (tableName === 'caribbean_tourism_posts') {
    // Increment post count for Caribbean posts
    const { data: currentPost } = await supabase
      .from('caribbean_tourism_posts')
      .select('postcount')
      .eq('id', postId)
      .single();
    
    updateData.postcount = (currentPost?.postcount || 0) + 1;
  }
  
  // Add platform-specific URL
  if (platform === 'substack') updateData.substackurl = url;
  if (platform === 'twitter') updateData.twitterurl = url;
  
  const { error: updateError } = await supabase
    .from(tableName)
    .update(updateData)
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
  }
  
  log(`Successfully marked post ${postId} as published on ${platform}`, 'success');
}

async function logPostingError(postId, platform, errorMessage, tableName = 'caribbean_tourism_posts') {
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

async function postToSubstack(post) {
  log(`Posting to Substack: "${post.title}"`);
  
  if (!fs.existsSync(SUBSTACK_SESSION_FILE)) {
    throw new Error('No saved Substack session found. Run setup_substack_session.mjs first.');
  }
  
  if (DRY_RUN) {
    log('[DRY RUN] Would post to Substack', 'warning');
    return 'https://richarddannibarrifortune.substack.com/p/dry-run-post';
  }
  
  const cookies = JSON.parse(fs.readFileSync(SUBSTACK_SESSION_FILE, 'utf-8'));
  
  const browser = await chromium.launch({ headless: HEADLESS });
  const context = await browser.newContext();
  await context.addCookies(cookies);
  
  const page = await context.newPage();
  
  try {
    // Navigate to publish page
    await page.goto(`${SUBSTACK_URL}/publish/home`, { waitUntil: 'networkidle', timeout: 60000 });
    
    // Click "New post" button
    const newPostButton = page.locator('button:has-text("New post"), a:has-text("New post")').first();
    await newPostButton.click({ timeout: 10000 });
    await page.waitForTimeout(3000);
    
    // Fill in title
    const titleInput = page.locator('textarea[placeholder*="Title"], input[placeholder*="Title"]').first();
    await titleInput.fill(post.title);
    await page.waitForTimeout(1000);
    
    // Fill in subtitle if exists
    if (post.subtitle) {
      const subtitleInput = page.locator('textarea[placeholder*="Subtitle"], input[placeholder*="Subtitle"]').first();
      await subtitleInput.fill(post.subtitle);
      await page.waitForTimeout(1000);
    }
    
    // Fill in content
    const contentEditor = page.locator('.ProseMirror, [contenteditable="true"]').first();
    await contentEditor.click();
    await contentEditor.fill(post.content);
    await page.waitForTimeout(2000);
    
    // Click "Continue" or "Publish"
    const continueButton = page.locator('button:has-text("Continue"), button:has-text("Publish")').first();
    await continueButton.click({ timeout: 10000 });
    await page.waitForTimeout(3000);
    
    // Click "Publish now" or "Send to everyone now"
    const publishButton = page.locator('button:has-text("Publish now"), button:has-text("Send to everyone now")').first();
    await publishButton.click({ timeout: 10000 });
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

async function postToTwitter(post, substackUrl = null) {
  log(`Posting to Twitter: "${post.title}"`);
  
  if (!fs.existsSync(TWITTER_SESSION_FILE)) {
    throw new Error('No saved Twitter session found. Run setup_sessions.mjs first.');
  }
  
  if (DRY_RUN) {
    log('[DRY RUN] Would post to Twitter', 'warning');
    return 'https://twitter.com/compose/tweet';
  }
  
  const cookies = JSON.parse(fs.readFileSync(TWITTER_SESSION_FILE, 'utf-8'));
  
  const browser = await chromium.launch({ headless: HEADLESS });
  const context = await browser.newContext();
  await context.addCookies(cookies);
  
  const page = await context.newPage();
  
  try {
    await page.goto('https://twitter.com/home', { waitUntil: 'networkidle', timeout: 60000 });
    
    // Extract hashtags from tags array
    const hashtags = post.tags ? post.tags.slice(0, 2).join(' ') : '';
    
    // Compose tweet (max 280 characters)
    let tweetText = `🌴 ${post.title}`;
    
    if (post.subtitle) {
      tweetText += `\n\n${post.subtitle}`;
    }
    
    if (substackUrl) {
      tweetText += `\n\nRead more: ${substackUrl}`;
    }
    
    tweetText += `\n\nWUKR Wire Intelligence`;
    
    if (hashtags) {
      tweetText += `\n${hashtags}`;
    }
    
    // Truncate if needed
    const finalTweet = tweetText.length > 280 
      ? tweetText.substring(0, 277) + '...' 
      : tweetText;
    
    // Click tweet compose box
    const tweetBox = page.locator('[data-testid="tweetTextarea_0"]').first();
    await tweetBox.click({ timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Type tweet
    await tweetBox.fill(finalTweet);
    await page.waitForTimeout(2000);
    
    // Click tweet button
    const tweetButton = page.locator('[data-testid="tweetButtonInline"]').first();
    await tweetButton.click({ timeout: 10000 });
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
// TASK HANDLERS
// ============================================================================

async function handleBase44Dispatch() {
  log('=== BASE 44 DISPATCH TASK ===');
  validateDateTime();
  
  const content = await getLatestBase44Content();
  
  if (!content) {
    log('No Base 44 content to dispatch. Exiting gracefully.', 'info');
    return { success: true, message: 'No content to dispatch' };
  }
  
  try {
    // Post to Substack
    const substackUrl = await postToSubstack(content);
    await markPostPublished(content.id, 'substack', substackUrl, 'processed_content');
    
    // Post to Twitter with Substack link
    const twitterUrl = await postToTwitter(content, substackUrl);
    await markPostPublished(content.id, 'twitter', twitterUrl, 'processed_content');
    
    log('Base 44 dispatch completed successfully', 'success');
    return { success: true, substackUrl, twitterUrl };
    
  } catch (error) {
    log(`Base 44 dispatch failed: ${error.message}`, 'error');
    await logPostingError(content.id, 'substack', error.message, 'processed_content');
    throw error;
  }
}

async function handleCaribbeanDispatch(slotName) {
  log(`=== CARIBBEAN TOURISM DISPATCH: ${slotName} ===`);
  validateDateTime();
  
  const posts = await getCaribbeanPosts(2);
  
  if (posts.length === 0) {
    log('No Caribbean tourism posts available. Exiting gracefully.', 'info');
    return { success: true, message: 'No posts to dispatch' };
  }
  
  const results = [];
  
  for (const post of posts) {
    try {
      // Post to Substack
      const substackUrl = await postToSubstack(post);
      await markPostPublished(post.id, 'substack', substackUrl);
      
      // Post to Twitter with Substack link
      const twitterUrl = await postToTwitter(post, substackUrl);
      await markPostPublished(post.id, 'twitter', twitterUrl);
      
      results.push({
        postId: post.id,
        postNumber: post.postnumber,
        title: post.title,
        substackUrl,
        twitterUrl,
        success: true
      });
      
      log(`Post ${post.postnumber} dispatched successfully`, 'success');
      
    } catch (error) {
      log(`Failed to dispatch post ${post.id}: ${error.message}`, 'error');
      await logPostingError(post.id, 'substack', error.message);
      
      results.push({
        postId: post.id,
        postNumber: post.postnumber,
        title: post.title,
        success: false,
        error: error.message
      });
    }
  }
  
  log(`Caribbean dispatch ${slotName} completed`, 'success');
  return { success: true, results };
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  if (!TASK) {
    log('No task specified. Use --task=<task_name>', 'error');
    log('Available tasks: base44_dispatch, caribbean_9am, caribbean_1pm, caribbean_6pm', 'info');
    process.exit(1);
  }
  
  log(`Starting WUKR Wire Dispatch Webhook - Task: ${TASK}`);
  
  try {
    let result;
    
    switch (TASK) {
      case 'base44_dispatch':
        result = await handleBase44Dispatch();
        break;
      
      case 'caribbean_9am':
        result = await handleCaribbeanDispatch('9 AM AST');
        break;
      
      case 'caribbean_1pm':
        result = await handleCaribbeanDispatch('1 PM AST');
        break;
      
      case 'caribbean_6pm':
        result = await handleCaribbeanDispatch('6 PM AST');
        break;
      
      default:
        log(`Unknown task: ${TASK}`, 'error');
        process.exit(1);
    }
    
    log('Dispatch webhook completed successfully', 'success');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
    
  } catch (error) {
    log(`Dispatch webhook failed: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

main();
