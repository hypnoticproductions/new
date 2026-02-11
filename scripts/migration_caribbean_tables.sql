-- Caribbean Tourism Content Syndication Database Schema
-- This schema tracks content posting history to avoid duplicates

-- Table: processed_content
-- Tracks all content that has been processed from Base 44
CREATE TABLE IF NOT EXISTS processed_content (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    subtitle VARCHAR(500),
    content TEXT NOT NULL,
    source VARCHAR(100) DEFAULT 'base44',
    substackUrl VARCHAR(500),
    twitterUrl VARCHAR(500),
    linkedinUrl VARCHAR(500),
    hashnodeUrl VARCHAR(500),
    devtoUrl VARCHAR(500),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    publishedAt TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending'
);

-- Table: caribbean_tourism_posts
-- Tracks the 6 Caribbean tourism posts and their rotation
CREATE TABLE IF NOT EXISTS caribbean_tourism_posts (
    id SERIAL PRIMARY KEY,
    postNumber INTEGER NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    subtitle VARCHAR(500),
    content TEXT NOT NULL,
    tags TEXT[],
    targetAudience VARCHAR(200) DEFAULT 'Caribbean tourism businesses',
    lastPostedAt TIMESTAMP,
    postCount INTEGER DEFAULT 0,
    substackUrl VARCHAR(500),
    twitterUrl VARCHAR(500),
    linkedinUrl VARCHAR(500),
    hashnodeUrl VARCHAR(500),
    devtoUrl VARCHAR(500),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: posting_history
-- Detailed log of every posting action
CREATE TABLE IF NOT EXISTS posting_history (
    id SERIAL PRIMARY KEY,
    postId INTEGER REFERENCES caribbean_tourism_posts(id),
    platform VARCHAR(50) NOT NULL,
    postUrl VARCHAR(500),
    status VARCHAR(50) NOT NULL,
    errorMessage TEXT,
    scheduledFor TIMESTAMP,
    postedAt TIMESTAMP,
    engagement JSONB,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: syndication_schedule
-- Manages the posting schedule (9 AM, 1 PM, 6 PM AST)
CREATE TABLE IF NOT EXISTS syndication_schedule (
    id SERIAL PRIMARY KEY,
    scheduledTime TIME NOT NULL,
    timezone VARCHAR(50) DEFAULT 'America/Puerto_Rico',
    postsPerSlot INTEGER DEFAULT 2,
    enabled BOOLEAN DEFAULT true,
    lastExecutedAt TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: platform_credentials
-- Stores platform authentication state (not passwords, just session info)
CREATE TABLE IF NOT EXISTS platform_credentials (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(50) NOT NULL UNIQUE,
    sessionValid BOOLEAN DEFAULT false,
    lastValidated TIMESTAMP,
    sessionExpiry TIMESTAMP,
    notes TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_caribbean_posts_last_posted ON caribbean_tourism_posts(lastPostedAt);
CREATE INDEX IF NOT EXISTS idx_posting_history_platform ON posting_history(platform);
CREATE INDEX IF NOT EXISTS idx_posting_history_posted_at ON posting_history(postedAt);
CREATE INDEX IF NOT EXISTS idx_processed_content_status ON processed_content(status);

-- Insert default schedule (9 AM, 1 PM, 6 PM AST)
INSERT INTO syndication_schedule (scheduledTime, postsPerSlot) 
VALUES 
    ('09:00:00', 2),
    ('13:00:00', 2),
    ('18:00:00', 2)
ON CONFLICT DO NOTHING;

-- Insert platform tracking
INSERT INTO platform_credentials (platform, sessionValid) 
VALUES 
    ('substack', false),
    ('twitter', false),
    ('linkedin', false),
    ('hashnode', false),
    ('devto', false)
ON CONFLICT (platform) DO NOTHING;
