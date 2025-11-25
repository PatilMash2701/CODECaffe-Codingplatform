const { createClient }=require('redis');

const redisClient = createClient({
    username: 'default',
    password: '5HsXGur0Q5JlyJpPvLjQq8WqFvMOyuaY',
    socket: {
        host: 'redis-10627.crce182.ap-south-1-1.ec2.redns.redis-cloud.com',
        port: 10627,
        reconnectStrategy: (retries) => {
            if (retries > 3) {
                console.error('Redis: Too many reconnection attempts, giving up. Redis will be disabled.');
                return false; // Stop reconnecting after 3 attempts
            }
            const delay = Math.min(retries * 1000, 3000);
            if (retries === 0) {
                console.log(`Redis: Connection lost, attempting to reconnect...`);
            }
            return delay;
        }
    }
});

// Handle Redis connection errors
let lastErrorTime = 0;
redisClient.on('error', (err) => {
    // Only log errors once per 10 seconds to avoid spam
    const now = Date.now();
    if (now - lastErrorTime > 10000) {
        console.error('Redis Client Error:', err.message);
        lastErrorTime = now;
    }
    // Don't crash the app - just log the error
});

redisClient.on('connect', () => {
    console.log('Redis: Connecting...');
});

redisClient.on('ready', () => {
    console.log('Redis: Client ready');
});

redisClient.on('reconnecting', () => {
    console.log('Redis: Reconnecting...');
});

redisClient.on('end', () => {
    console.log('Redis: Connection ended');
});

module.exports=redisClient;