const { Pool } = require('pg');
const { createClient } = require('redis');

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Redis configuration
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = createClient({ url: redisUrl });

redis.on('error', (err) => console.log('Redis Client Error', err));

if (process.env.NODE_ENV !== 'test') {
  redis.connect().catch(console.error);
}

module.exports = {
  pool,
  redis
};
