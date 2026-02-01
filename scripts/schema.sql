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
    status VARCHAR(50) DEFAULT 'pending' -- pending, published, failed
);

-- Table: caribbean_tourism_posts
-- Tracks the 6 Caribbean tourism posts and their rotation
CREATE TABLE IF NOT EXISTS caribbean_tourism_posts (
    id SERIAL PRIMARY KEY,
    postNumber INTEGER NOT NULL UNIQUE, -- 1-6
    title VARCHAR(500) NOT NULL,
    subtitle VARCHAR(500),
    content TEXT NOT NULL,
    tags TEXT[], -- Array of hashtags
    targetAudience VARCHAR(200) DEFAULT 'Caribbean tourism businesses',
    lastPostedAt TIMESTAMP,
    postCount INTEGER DEFAULT 0, -- How many times this post has been published
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
    platform VARCHAR(50) NOT NULL, -- substack, twitter, linkedin, hashnode, devto
    postUrl VARCHAR(500),
    status VARCHAR(50) NOT NULL, -- success, failed, pending
    errorMessage TEXT,
    scheduledFor TIMESTAMP,
    postedAt TIMESTAMP,
    engagement JSONB, -- Store likes, shares, comments, etc.
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: syndication_schedule
-- Manages the posting schedule (9 AM, 1 PM, 6 PM AST)
CREATE TABLE IF NOT EXISTS syndication_schedule (
    id SERIAL PRIMARY KEY,
    scheduledTime TIME NOT NULL, -- 09:00:00, 13:00:00, 18:00:00
    timezone VARCHAR(50) DEFAULT 'America/Puerto_Rico', -- AST
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

-- Function to get next posts to publish (rotation logic)
CREATE OR REPLACE FUNCTION get_next_posts_to_publish(num_posts INTEGER DEFAULT 2)
RETURNS TABLE (
    id INTEGER,
    postNumber INTEGER,
    title VARCHAR(500),
    subtitle VARCHAR(500),
    content TEXT,
    tags TEXT[],
    lastPostedAt TIMESTAMP,
    postCount INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.postNumber,
        p.title,
        p.subtitle,
        p.content,
        p.tags,
        p.lastPostedAt,
        p.postCount
    FROM caribbean_tourism_posts p
    ORDER BY 
        p.lastPostedAt NULLS FIRST,  -- Posts never published come first
        p.postCount ASC,              -- Then posts published least often
        p.postNumber ASC              -- Then by post number
    LIMIT num_posts;
END;
$$ LANGUAGE plpgsql;

-- Function to mark post as published
CREATE OR REPLACE FUNCTION mark_post_published(
    post_id INTEGER,
    platform_name VARCHAR(50),
    post_url VARCHAR(500)
)
RETURNS VOID AS $$
BEGIN
    -- Update the post's last posted time and increment count
    UPDATE caribbean_tourism_posts
    SET 
        lastPostedAt = CURRENT_TIMESTAMP,
        postCount = postCount + 1,
        updatedAt = CURRENT_TIMESTAMP
    WHERE id = post_id;
    
    -- Update the platform-specific URL
    IF platform_name = 'substack' THEN
        UPDATE caribbean_tourism_posts SET substackUrl = post_url WHERE id = post_id;
    ELSIF platform_name = 'twitter' THEN
        UPDATE caribbean_tourism_posts SET twitterUrl = post_url WHERE id = post_id;
    ELSIF platform_name = 'linkedin' THEN
        UPDATE caribbean_tourism_posts SET linkedinUrl = post_url WHERE id = post_id;
    ELSIF platform_name = 'hashnode' THEN
        UPDATE caribbean_tourism_posts SET hashnodeUrl = post_url WHERE id = post_id;
    ELSIF platform_name = 'devto' THEN
        UPDATE caribbean_tourism_posts SET devtoUrl = post_url WHERE id = post_id;
    END IF;
    
    -- Log to posting history
    INSERT INTO posting_history (postId, platform, postUrl, status, postedAt)
    VALUES (post_id, platform_name, post_url, 'success', CURRENT_TIMESTAMP);
END;
$$ LANGUAGE plpgsql;

-- View for posting analytics
CREATE OR REPLACE VIEW posting_analytics AS
SELECT 
    p.postNumber,
    p.title,
    p.postCount,
    p.lastPostedAt,
    COUNT(DISTINCT ph.platform) as platforms_posted,
    ARRAY_AGG(DISTINCT ph.platform) as platforms,
    MAX(ph.postedAt) as most_recent_post
FROM caribbean_tourism_posts p
LEFT JOIN posting_history ph ON p.id = ph.postId AND ph.status = 'success'
GROUP BY p.id, p.postNumber, p.title, p.postCount, p.lastPostedAt
ORDER BY p.postNumber;

-- Comments for documentation
COMMENT ON TABLE caribbean_tourism_posts IS 'Stores the 6 Caribbean tourism posts for rotation';
COMMENT ON TABLE posting_history IS 'Detailed log of all posting actions across platforms';
COMMENT ON TABLE syndication_schedule IS 'Defines when posts should be published (9 AM, 1 PM, 6 PM AST)';
COMMENT ON FUNCTION get_next_posts_to_publish IS 'Returns the next N posts to publish based on rotation logic';
COMMENT ON FUNCTION mark_post_published IS 'Updates post status and logs to posting history after successful publish';
