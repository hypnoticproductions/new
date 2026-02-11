#!/usr/bin/env node

/**
 * Session Setup Helper - WUKR Wire Caribbean Tourism Syndication
 * 
 * This script helps you set up login sessions for Substack and Twitter
 * Run this once to save your login sessions for autonomous operation
 * 
 * Usage: node scripts/setup_login_sessions.mjs [--platform=substack|twitter|both]
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
    substackSessionFile: path.join(process.env.HOME, '.substack-session.json'),
    twitterSessionFile: path.join(process.env.HOME, '.twitter-session.json'),
    substackUrl: 'https://richarddannibarrifortune.substack.com',
    twitterUrl: 'https://x.com',
    platform: process.argv.find(arg => arg.startsWith('--platform='))?.split('=')[1] || 'both'
};

console.log(`
╔════════════════════════════════════════════════════════════════╗
║  WUKR Wire - Login Session Setup Helper                       ║
║  Caribbean Tourism Syndication System                         ║
╚════════════════════════════════════════════════════════════════╝
`);

console.log(`Setting up login sessions for: ${CONFIG.platform}`);
console.log('');

// Helper to prompt user
function prompt(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        rl.question(question, answer => {
            rl.close();
            resolve(answer);
        });
    });
}

// Setup Substack session
async function setupSubstack() {
    console.log('\n' + '='.repeat(70));
    console.log('SUBSTACK SESSION SETUP');
    console.log('='.repeat(70));
    console.log('\nA browser window will open. Please:');
    console.log('1. Log in to your Substack account');
    console.log('2. Navigate to your publisher dashboard');
    console.log('3. Come back here and press Enter');
    console.log('');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // Navigate to Substack
        await page.goto(`${CONFIG.substackUrl}/publish/home`);
        
        console.log('Browser opened. Waiting for you to log in...');
        console.log('');
        
        // Wait for user to confirm they've logged in
        await prompt('Press Enter when you have logged in and are on the publisher dashboard...');
        
        // Save the session
        const storageState = await context.storageState();
        await fs.writeFile(CONFIG.substackSessionFile, JSON.stringify(storageState, null, 2));
        
        console.log('✅ Substack session saved to:', CONFIG.substackSessionFile);
        
        // Verify the session works
        console.log('🔍 Verifying session...');
        const url = page.url();
        if (url.includes('/publish') || url.includes('substack.com')) {
            console.log('✅ Session verified! You are logged in to Substack.');
        } else {
            console.log('⚠️  Warning: Session may not be valid. Please try again.');
        }
        
    } catch (error) {
        console.error('❌ Error setting up Substack session:', error.message);
    } finally {
        await browser.close();
    }
}

// Setup Twitter session
async function setupTwitter() {
    console.log('\n' + '='.repeat(70));
    console.log('TWITTER SESSION SETUP');
    console.log('='.repeat(70));
    console.log('\nA browser window will open. Please:');
    console.log('1. Log in to your Twitter/X account');
    console.log('2. Navigate to your home timeline');
    console.log('3. Come back here and press Enter');
    console.log('');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // Navigate to Twitter
        await page.goto(CONFIG.twitterUrl);
        
        console.log('Browser opened. Waiting for you to log in...');
        console.log('');
        
        // Wait for user to confirm they've logged in
        await prompt('Press Enter when you have logged in and are on your home timeline...');
        
        // Save the session
        const storageState = await context.storageState();
        await fs.writeFile(CONFIG.twitterSessionFile, JSON.stringify(storageState, null, 2));
        
        console.log('✅ Twitter session saved to:', CONFIG.twitterSessionFile);
        
        // Verify the session works
        console.log('🔍 Verifying session...');
        const url = page.url();
        if (url.includes('x.com') && !url.includes('login')) {
            console.log('✅ Session verified! You are logged in to Twitter.');
        } else {
            console.log('⚠️  Warning: Session may not be valid. Please try again.');
        }
        
    } catch (error) {
        console.error('❌ Error setting up Twitter session:', error.message);
    } finally {
        await browser.close();
    }
}

// Main execution
async function main() {
    try {
        if (CONFIG.platform === 'substack' || CONFIG.platform === 'both') {
            await setupSubstack();
        }
        
        if (CONFIG.platform === 'twitter' || CONFIG.platform === 'both') {
            await setupTwitter();
        }
        
        console.log('\n' + '='.repeat(70));
        console.log('SETUP COMPLETE');
        console.log('='.repeat(70));
        console.log('\n✅ Login sessions have been saved!');
        console.log('\nYou can now run the posting script autonomously:');
        console.log('   node scripts/post_caribbean_tourism_now.mjs');
        console.log('\nOr test with dry-run:');
        console.log('   node scripts/post_caribbean_tourism_now.mjs --dry-run');
        console.log('\nSessions are saved in:');
        if (CONFIG.platform === 'substack' || CONFIG.platform === 'both') {
            console.log(`   - ${CONFIG.substackSessionFile}`);
        }
        if (CONFIG.platform === 'twitter' || CONFIG.platform === 'both') {
            console.log(`   - ${CONFIG.twitterSessionFile}`);
        }
        console.log('\n💡 Tip: Sessions typically last 30 days. Re-run this script if you see login errors.');
        console.log('');
        
    } catch (error) {
        console.error('\n❌ Fatal error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the script
main();
