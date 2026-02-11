#!/usr/bin/env node

/**
 * WUKR Wire Webhook Dispatch Server
 * 
 * Provides HTTP endpoint for triggering the base44_to_substack.mjs script
 * Can be deployed to any Node.js hosting platform (Vercel, Railway, etc.)
 * 
 * Usage:
 *   node scripts/webhook_dispatch.mjs
 * 
 * Endpoints:
 *   POST /dispatch - Trigger posting (requires API key)
 *   GET /health - Health check
 *   GET /status - Get posting status
 */

import http from 'http';
import { spawn } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.WEBHOOK_API_KEY || 'wukr-wire-dispatch-2026';
const SUPABASE_URL = 'https://ebrarmerpzlrbsfpmlkg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVicmFybWVycHpscmJzZnBtbGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Njk4NzgsImV4cCI6MjA4NjA0NTg3OH0.6o9DjnXLkleqaYSfnpNcSlOiiKC-QczOhwLswe8ku8U';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Track execution state
let isRunning = false;
let lastExecution = null;
let lastResult = null;

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  }[type] || 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

async function getPostingStatus() {
  try {
    const { data: posts } = await supabase
      .from('caribbean_tourism_posts')
      .select('postnumber, title, postcount, lastpostedat, substackurl, twitterurl')
      .order('postnumber');
    
    const { data: history } = await supabase
      .from('posting_history')
      .select('*')
      .order('postedat', { ascending: false })
      .limit(10);
    
    return {
      posts: posts || [],
      recentHistory: history || [],
      lastExecution,
      lastResult,
      isRunning
    };
  } catch (error) {
    log(`Error fetching status: ${error.message}`, 'error');
    return { error: error.message };
  }
}

async function triggerDispatch(count = 2, platforms = ['substack', 'twitter']) {
  if (isRunning) {
    return {
      success: false,
      message: 'Dispatch already in progress',
      startedAt: lastExecution
    };
  }
  
  isRunning = true;
  lastExecution = new Date().toISOString();
  
  log(`Triggering dispatch: ${count} posts to ${platforms.join(', ')}`);
  
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, 'base44_to_substack.mjs');
    const args = [
      scriptPath,
      `--count=${count}`,
      `--platform=${platforms.join(',')}`
    ];
    
    const child = spawn('node', args, {
      cwd: path.dirname(__dirname),
      env: { ...process.env, HEADLESS: 'true' }
    });
    
    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.log(text);
    });
    
    child.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      console.error(text);
    });
    
    child.on('close', (code) => {
      isRunning = false;
      
      const result = {
        success: code === 0,
        exitCode: code,
        startedAt: lastExecution,
        completedAt: new Date().toISOString(),
        output: output.slice(-1000), // Last 1000 chars
        error: errorOutput.slice(-1000)
      };
      
      lastResult = result;
      
      if (code === 0) {
        log('Dispatch completed successfully', 'success');
      } else {
        log(`Dispatch failed with exit code ${code}`, 'error');
      }
      
      resolve(result);
    });
  });
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health check
  if (url.pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }));
    return;
  }
  
  // Status endpoint
  if (url.pathname === '/status' && req.method === 'GET') {
    const status = await getPostingStatus();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(status, null, 2));
    return;
  }
  
  // Dispatch endpoint
  if (url.pathname === '/dispatch' && req.method === 'POST') {
    // Check API key
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${API_KEY}`) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    
    // Parse request body
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const params = body ? JSON.parse(body) : {};
        const count = params.count || 2;
        const platforms = params.platforms || ['substack', 'twitter'];
        
        const result = await triggerDispatch(count, platforms);
        
        res.writeHead(result.success ? 200 : 500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result, null, 2));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }
  
  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  log(`WUKR Wire Webhook Dispatch Server running on port ${PORT}`, 'success');
  log(`Health check: http://localhost:${PORT}/health`);
  log(`Status: http://localhost:${PORT}/status`);
  log(`Dispatch: POST http://localhost:${PORT}/dispatch (requires Authorization header)`);
  log(`API Key: ${API_KEY}`);
});
