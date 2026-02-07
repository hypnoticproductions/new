#!/usr/bin/env node

/**
 * Session Capture Helper Script
 * 
 * This script helps you capture browser sessions for Substack and Twitter
 * to enable autonomous posting without manual login each time.
 * 
 * Usage:
 *   node scripts/capture_sessions.mjs [platform]
 * 
 * Platforms: substack, twitter, both (default)
 * 
 * Example:
 *   node scripts/capture_sessions.mjs substack
 *   node scripts/capture_sessions.mjs twitter
 *   node scripts/capture_sessions.mjs both
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

const CONFIG = {
    substackSessionFile: path.join(process.env.HOME, '.substack-session.json'),
    twitterSessionFile: path.join(process.env.HOME, '.twitter-session.json'),
    substackUrl: 'https://richarddannibarrifortune.substack.com',
    twitterUrl: 'https://x.com',
    waitTime: 60000 // 60 seconds to log in
};

async function captureSession(platform) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`  ${platform.toUpperCase()} SESSION CAPTURE`);
    console.log('='.repeat(70));
    
    const url = platform === 'substack' ? CONFIG.substackUrl : CONFIG.twitterUrl;
    const sessionFile = platform === 'substack' ? CONFIG.substackSessionFile : CONFIG.twitterSessionFile;
    
    console.log(`\n📋 Instructions:`);
    console.log(`1. A browser will open to ${url}`);
    console.log(`2. Log in to your account`);
    console.log(`3. Wait for the success message`);
    console.log(`4. The browser will close automatically\n`);
    console.log(`⏳ You have 60 seconds to complete the login...\n`);
    
    const browser = await chromium.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });
    
    const page = await context.newPage();
    
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        console.log(`✅ Browser opened to ${platform}`);
        console.log(`⏳ Waiting for you to log in...`);
        
        // Wait for user to log in
        await page.waitForTimeout(CONFIG.waitTime);
        
        // Capture cookies
        const cookies = await context.cookies();
        
        if (cookies.length === 0) {
            throw new Error('No cookies captured. Did you log in?');
        }
        
        await fs.writeFile(sessionFile, JSON.stringify(cookies, null, 2));
        
        console.log(`\n✅ Session captured successfully!`);
        console.log(`📁 Saved to: ${sessionFile}`);
        console.log(`🔢 Captured ${cookies.length} cookies`);
        
        // Verify the session file
        const savedData = await fs.readFile(sessionFile, 'utf-8');
        const savedCookies = JSON.parse(savedData);
        console.log(`✅ Verified: ${savedCookies.length} cookies saved`);
        
    } catch (error) {
        console.error(`\n❌ Error capturing session:`, error.message);
        throw error;
    } finally {
        await browser.close();
        console.log(`\n🔒 Browser closed\n`);
    }
}

async function main() {
    const platform = process.argv[2] || 'both';
    
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║         SESSION CAPTURE HELPER - WUKR Wire Syndication        ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    if (platform === 'both') {
        console.log('📋 Capturing sessions for both Substack and Twitter\n');
        
        try {
            await captureSession('substack');
            console.log('\n⏸️  Pausing 3 seconds before next capture...\n');
            await new Promise(resolve => setTimeout(resolve, 3000));
            await captureSession('twitter');
        } catch (error) {
            console.error('\n❌ Session capture failed:', error.message);
            process.exit(1);
        }
        
    } else if (platform === 'substack' || platform === 'twitter') {
        try {
            await captureSession(platform);
        } catch (error) {
            console.error('\n❌ Session capture failed:', error.message);
            process.exit(1);
        }
        
    } else {
        console.error('❌ Invalid platform. Use: substack, twitter, or both');
        process.exit(1);
    }
    
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    ✅ SESSION CAPTURE COMPLETE                 ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    console.log('📋 Next Steps:');
    console.log('1. Test the sessions with a dry run:');
    console.log('   node scripts/post_caribbean_rotation.mjs --dry-run');
    console.log('');
    console.log('2. Post your first 2 articles:');
    console.log('   node scripts/post_caribbean_rotation.mjs');
    console.log('');
    console.log('3. Set up automated scheduling (see CARIBBEAN_POSTING_SETUP_GUIDE.md)');
    console.log('');
    console.log('💡 Sessions typically last 30 days. Re-run this script when they expire.\n');
}

main().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
});
