#!/usr/bin/env node

/**
 * WUKR Wire Platform Session Setup
 * 
 * One-time setup script to capture login sessions for Substack and Twitter.
 * Run this script to log in manually, then the automation will use saved sessions.
 * 
 * Execution: node scripts/setup_platform_sessions.mjs --platform=<platform>
 * 
 * Platforms:
 * - substack: Log in to Substack
 * - twitter: Log in to Twitter
 * - all: Set up both platforms
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUBSTACK_URL = 'https://richarddannibarrifortune.substack.com';
const SUBSTACK_SESSION_FILE = path.join(process.env.HOME, '.substack-session.json');
const TWITTER_SESSION_FILE = path.join(process.env.HOME, '.twitter-session.json');

// Parse platform argument
const platformArg = process.argv.find(arg => arg.startsWith('--platform='));
const PLATFORM = platformArg ? platformArg.split('=')[1] : 'all';

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

// ============================================================================
// SESSION SETUP FUNCTIONS
// ============================================================================

async function setupSubstackSession() {
  log('Setting up Substack login session...');
  log('A browser window will open. Please log in to Substack.', 'info');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto(`${SUBSTACK_URL}/publish/home`);
    
    log('Please complete the login process in the browser window...', 'warning');
    log('Waiting 90 seconds for you to log in...', 'info');
    
    // Wait for login
    await page.waitForTimeout(90000);
    
    // Check if we're on the publish page (indicates successful login)
    const currentUrl = page.url();
    if (currentUrl.includes('/publish')) {
      log('Login detected! Saving session...', 'success');
    } else {
      log('Could not confirm login. Saving session anyway...', 'warning');
    }
    
    // Save cookies
    const cookies = await context.cookies();
    fs.writeFileSync(SUBSTACK_SESSION_FILE, JSON.stringify(cookies, null, 2));
    
    log(`Substack session saved to ${SUBSTACK_SESSION_FILE}`, 'success');
    log(`Captured ${cookies.length} cookies`, 'debug');
    
    await browser.close();
    return true;
    
  } catch (error) {
    log(`Failed to set up Substack session: ${error.message}`, 'error');
    await browser.close();
    return false;
  }
}

async function setupTwitterSession() {
  log('Setting up Twitter login session...');
  log('A browser window will open. Please log in to Twitter.', 'info');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto('https://twitter.com/home');
    
    log('Please complete the login process in the browser window...', 'warning');
    log('Waiting 90 seconds for you to log in...', 'info');
    
    // Wait for login
    await page.waitForTimeout(90000);
    
    // Check if we're on the home page (indicates successful login)
    const currentUrl = page.url();
    if (currentUrl.includes('/home')) {
      log('Login detected! Saving session...', 'success');
    } else {
      log('Could not confirm login. Saving session anyway...', 'warning');
    }
    
    // Save cookies
    const cookies = await context.cookies();
    fs.writeFileSync(TWITTER_SESSION_FILE, JSON.stringify(cookies, null, 2));
    
    log(`Twitter session saved to ${TWITTER_SESSION_FILE}`, 'success');
    log(`Captured ${cookies.length} cookies`, 'debug');
    
    await browser.close();
    return true;
    
  } catch (error) {
    log(`Failed to set up Twitter session: ${error.message}`, 'error');
    await browser.close();
    return false;
  }
}

// ============================================================================
// SESSION VALIDATION
// ============================================================================

async function validateSubstackSession() {
  log('Validating Substack session...');
  
  if (!fs.existsSync(SUBSTACK_SESSION_FILE)) {
    log('No Substack session file found', 'error');
    return false;
  }
  
  const cookies = JSON.parse(fs.readFileSync(SUBSTACK_SESSION_FILE, 'utf-8'));
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addCookies(cookies);
  
  const page = await context.newPage();
  
  try {
    await page.goto(`${SUBSTACK_URL}/publish/home`, { waitUntil: 'networkidle', timeout: 30000 });
    
    const currentUrl = page.url();
    const isValid = currentUrl.includes('/publish');
    
    if (isValid) {
      log('Substack session is valid ✓', 'success');
    } else {
      log('Substack session appears invalid (redirected to login)', 'error');
    }
    
    await browser.close();
    return isValid;
    
  } catch (error) {
    log(`Failed to validate Substack session: ${error.message}`, 'error');
    await browser.close();
    return false;
  }
}

async function validateTwitterSession() {
  log('Validating Twitter session...');
  
  if (!fs.existsSync(TWITTER_SESSION_FILE)) {
    log('No Twitter session file found', 'error');
    return false;
  }
  
  const cookies = JSON.parse(fs.readFileSync(TWITTER_SESSION_FILE, 'utf-8'));
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addCookies(cookies);
  
  const page = await context.newPage();
  
  try {
    await page.goto('https://twitter.com/home', { waitUntil: 'networkidle', timeout: 30000 });
    
    const currentUrl = page.url();
    const isValid = currentUrl.includes('/home');
    
    if (isValid) {
      log('Twitter session is valid ✓', 'success');
    } else {
      log('Twitter session appears invalid (redirected to login)', 'error');
    }
    
    await browser.close();
    return isValid;
    
  } catch (error) {
    log(`Failed to validate Twitter session: ${error.message}`, 'error');
    await browser.close();
    return false;
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  log('=== WUKR Wire Platform Session Setup ===');
  log(`Platform: ${PLATFORM}`);
  
  const results = {
    substack: { setup: false, valid: false },
    twitter: { setup: false, valid: false }
  };
  
  try {
    if (PLATFORM === 'substack' || PLATFORM === 'all') {
      results.substack.setup = await setupSubstackSession();
      if (results.substack.setup) {
        results.substack.valid = await validateSubstackSession();
      }
    }
    
    if (PLATFORM === 'twitter' || PLATFORM === 'all') {
      results.twitter.setup = await setupTwitterSession();
      if (results.twitter.setup) {
        results.twitter.valid = await validateTwitterSession();
      }
    }
    
    log('\n=== SESSION SETUP SUMMARY ===');
    
    if (PLATFORM === 'substack' || PLATFORM === 'all') {
      log(`Substack: ${results.substack.valid ? '✅ Valid' : '❌ Invalid'}`, 
          results.substack.valid ? 'success' : 'error');
    }
    
    if (PLATFORM === 'twitter' || PLATFORM === 'all') {
      log(`Twitter: ${results.twitter.valid ? '✅ Valid' : '❌ Invalid'}`, 
          results.twitter.valid ? 'success' : 'error');
    }
    
    const allValid = (PLATFORM === 'all') 
      ? (results.substack.valid && results.twitter.valid)
      : (PLATFORM === 'substack' ? results.substack.valid : results.twitter.valid);
    
    if (allValid) {
      log('\n✅ All sessions are valid! Automation is ready to run.', 'success');
      process.exit(0);
    } else {
      log('\n⚠️  Some sessions are invalid. Please run this script again.', 'warning');
      process.exit(1);
    }
    
  } catch (error) {
    log(`Session setup failed: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

main();
