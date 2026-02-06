#!/usr/bin/env node

/**
 * Session Setup Script for Caribbean Tourism Syndication
 * 
 * This script opens browsers for Substack and Twitter, allowing the user to log in manually.
 * Once logged in, it saves the session cookies for autonomous posting.
 * 
 * Usage: node scripts/setup_sessions.mjs
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
    substackUrl: 'https://richarddannibarrifortune.substack.com/publish/home',
    twitterUrl: 'https://x.com/home',
    substackSessionFile: path.join(process.env.HOME, '.substack-session.json'),
    twitterSessionFile: path.join(process.env.HOME, '.twitter-session.json'),
    headless: false, // Must be visible for user login
    timeout: 300000 // 5 minutes for user to log in
};

async function setupSubstackSession() {
    console.log('\n🔐 Setting up Substack session...');
    console.log('📌 A browser window will open. Please log in to Substack.');
    console.log('⏳ Once logged in, press ENTER in this terminal to save the session.\n');

    const browser = await chromium.launch({ 
        headless: CONFIG.headless,
        args: ['--start-maximized']
    });
    
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    try {
        await page.goto(CONFIG.substackUrl, { waitUntil: 'networkidle' });
        
        console.log('✅ Substack page loaded. Please log in now...');
        console.log('💡 After logging in, you should see your Substack dashboard.');
        console.log('📝 Press ENTER when ready to save the session...');
        
        // Wait for user to press Enter
        await new Promise(resolve => {
            process.stdin.once('data', resolve);
        });
        
        // Save cookies
        const cookies = await context.cookies();
        await fs.writeFile(CONFIG.substackSessionFile, JSON.stringify(cookies, null, 2));
        
        console.log('✅ Substack session saved to:', CONFIG.substackSessionFile);
        console.log(`📊 Saved ${cookies.length} cookies\n`);
        
    } catch (error) {
        console.error('❌ Error setting up Substack session:', error.message);
        throw error;
    } finally {
        await browser.close();
    }
}

async function setupTwitterSession() {
    console.log('\n🔐 Setting up Twitter/X session...');
    console.log('📌 A browser window will open. Please log in to Twitter/X.');
    console.log('⏳ Once logged in, press ENTER in this terminal to save the session.\n');

    const browser = await chromium.launch({ 
        headless: CONFIG.headless,
        args: ['--start-maximized']
    });
    
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    try {
        await page.goto(CONFIG.twitterUrl, { waitUntil: 'networkidle' });
        
        console.log('✅ Twitter/X page loaded. Please log in now...');
        console.log('💡 After logging in, you should see your Twitter/X home feed.');
        console.log('📝 Press ENTER when ready to save the session...');
        
        // Wait for user to press Enter
        await new Promise(resolve => {
            process.stdin.once('data', resolve);
        });
        
        // Save cookies
        const cookies = await context.cookies();
        await fs.writeFile(CONFIG.twitterSessionFile, JSON.stringify(cookies, null, 2));
        
        console.log('✅ Twitter/X session saved to:', CONFIG.twitterSessionFile);
        console.log(`📊 Saved ${cookies.length} cookies\n`);
        
    } catch (error) {
        console.error('❌ Error setting up Twitter/X session:', error.message);
        throw error;
    } finally {
        await browser.close();
    }
}

async function verifySession(platform, sessionFile) {
    console.log(`\n🔍 Verifying ${platform} session...`);
    
    try {
        const cookiesData = await fs.readFile(sessionFile, 'utf-8');
        const cookies = JSON.parse(cookiesData);
        
        if (cookies.length === 0) {
            console.log(`⚠️  ${platform} session file is empty`);
            return false;
        }
        
        console.log(`✅ ${platform} session verified: ${cookies.length} cookies loaded`);
        return true;
    } catch (error) {
        console.log(`❌ ${platform} session verification failed:`, error.message);
        return false;
    }
}

async function main() {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║   Caribbean Tourism Syndication - Session Setup               ║');
    console.log('║   WUKR Wire Daily Dispatch                                    ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    console.log('This script will help you set up browser sessions for:');
    console.log('  1. Substack (richarddannibarrifortune.substack.com)');
    console.log('  2. Twitter/X (x.com)\n');
    
    console.log('⚠️  IMPORTANT:');
    console.log('  - Browser windows will open for each platform');
    console.log('  - Log in using your credentials');
    console.log('  - Press ENTER in this terminal after logging in');
    console.log('  - Sessions will be saved for autonomous posting\n');
    
    console.log('Press ENTER to start setup...');
    await new Promise(resolve => {
        process.stdin.once('data', resolve);
    });
    
    // Setup Substack
    await setupSubstackSession();
    
    // Setup Twitter
    await setupTwitterSession();
    
    // Verify both sessions
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║   Session Verification                                        ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    const substackValid = await verifySession('Substack', CONFIG.substackSessionFile);
    const twitterValid = await verifySession('Twitter/X', CONFIG.twitterSessionFile);
    
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║   Setup Complete                                              ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    if (substackValid && twitterValid) {
        console.log('✅ All sessions are ready for autonomous posting!');
        console.log('\nNext steps:');
        console.log('  1. Run: node scripts/post_caribbean_rotation.mjs');
        console.log('  2. Or schedule: bash scripts/schedule_caribbean_posts.sh\n');
    } else {
        console.log('⚠️  Some sessions failed to set up. Please try again.');
        console.log('   Run: node scripts/setup_sessions.mjs\n');
    }
    
    process.exit(0);
}

main().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
});
