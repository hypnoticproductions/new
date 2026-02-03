#!/usr/bin/env node

/**
 * Substack Session Setup Script
 * 
 * This script opens Substack in a visible browser window for manual login.
 * After login, it saves the session cookies for automated posting.
 * 
 * Usage: node scripts/setup_substack_session.mjs
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
    sessionFile: path.join(process.env.HOME, '.substack-session.json'),
    substackUrl: 'https://richarddannibarrifortune.substack.com',
    timeout: 60000
};

async function setupSubstackSession() {
    console.log('🔐 Substack Session Setup');
    console.log('========================\n');
    console.log('This script will open Substack in a browser window.');
    console.log('Please log in manually, then press Enter here to save the session.\n');

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
        console.log('🌐 Opening Substack...');
        await page.goto(`${CONFIG.substackUrl}/publish/home`, { 
            waitUntil: 'networkidle',
            timeout: CONFIG.timeout 
        });

        console.log('\n📋 Instructions:');
        console.log('   1. Log in to Substack in the browser window');
        console.log('   2. Navigate to your publisher dashboard');
        console.log('   3. Press Enter in this terminal when done\n');

        // Wait for user to press Enter
        await new Promise(resolve => {
            process.stdin.once('data', () => resolve());
        });

        // Check if logged in
        const url = page.url();
        if (url.includes('/sign-in') || url.includes('login')) {
            console.log('❌ Still on login page. Please complete login and try again.');
            process.exit(1);
        }

        // Save session
        const cookies = await context.cookies();
        await fs.writeFile(CONFIG.sessionFile, JSON.stringify(cookies, null, 2));
        console.log(`✅ Session saved to ${CONFIG.sessionFile}`);
        console.log('\n🎉 Setup complete! You can now run automated posting scripts.\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

setupSubstackSession().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
