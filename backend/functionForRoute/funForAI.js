const axios = require('axios');
const { sendSSE } = require('../utils/sseManager');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

/**
 * Non-streaming AI Doubt Solver
 * Route: POST /ai/chat
 */
const solveDoubt = async (req, res) => {
    try {
        console.log('Received AI chat request body:', JSON.stringify(req.body, null, 2));

        const { data } = await axios.post(
            `${AI_SERVICE_URL}/chat`,
            req.body,
            { timeout: 120000 }
        );

        return res.status(200).json(data);
    } catch (error) {
        console.error('AI Service Error:', error.message);

        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                message: 'AI server is not running. Start it on port 8000.',
            });
        }

        if (error.response?.data) {
            return res.status(error.response.status || 502).json(error.response.data);
        }

        return res.status(500).json({
            success: false,
            message: 'An error occurred while processing your request.',
        });
    }
};

/**
 * SSE Streaming AI Doubt Solver
 * Route: POST /ai/chat-stream
 */
const solveDoubtStream = async (req, res) => {
    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    if (typeof res.flushHeaders === 'function') {
        res.flushHeaders();
    }

    // Keep-alive heartbeat
    const heartbeat = setInterval(() => {
        if (res.writableEnded || res.finished) {
            clearInterval(heartbeat);
            return;
        }
        res.write(': keep-alive\n\n');
    }, 15000);

    req.on('close', () => {
        clearInterval(heartbeat);
    });

    try {
        console.log('Received AI stream request:', req.body?.question || 'Empty question');

        // First attempt: Call /chat-stream on the AI service with streaming response
        try {
            const streamResponse = await axios.post(
                `${AI_SERVICE_URL}/chat-stream`,
                req.body,
                {
                    responseType: 'stream',
                    timeout: 120000
                }
            );

            streamResponse.data.on('data', (chunk) => {
                if (!res.writableEnded && !res.finished) {
                    res.write(chunk);
                }
            });

            streamResponse.data.on('end', () => {
                clearInterval(heartbeat);
                if (!res.writableEnded && !res.finished) {
                    sendSSE(res, 'done', { message: 'Stream completed' });
                    res.end();
                }
            });

            streamResponse.data.on('error', (err) => {
                console.error('AI Stream response error:', err.message);
                clearInterval(heartbeat);
                if (!res.writableEnded && !res.finished) {
                    sendSSE(res, 'error', { message: 'AI stream encountered an error' });
                    res.end();
                }
            });

            return;

        } catch (streamError) {
            // If /chat-stream is 404/not implemented on AI service, fallback to /chat with chunking
            if (streamError.response && streamError.response.status === 404) {
                console.log('AI service /chat-stream not found, falling back to /chat');
                
                const { data } = await axios.post(
                    `${AI_SERVICE_URL}/chat`,
                    req.body,
                    { timeout: 120000 }
                );

                const fullText = data?.message || data?.response || JSON.stringify(data);
                
                // Stream the response tokens progressively
                const words = fullText.split(/(\s+)/);
                for (const word of words) {
                    if (res.writableEnded || res.finished) break;
                    sendSSE(res, 'token', { token: word });
                    await new Promise(r => setTimeout(r, 20)); // simulated token stream
                }

                clearInterval(heartbeat);
                sendSSE(res, 'done', { message: 'Stream completed' });
                return res.end();
            }

            throw streamError;
        }

    } catch (error) {
        clearInterval(heartbeat);
        console.error('AI Service Stream Error:', error.message);

        if (error.code === 'ECONNREFUSED') {
            sendSSE(res, 'error', {
                message: 'AI server is not running. Please start the AI service on port 8000.'
            });
        } else {
            sendSSE(res, 'error', {
                message: error.response?.data?.message || error.message || 'An error occurred while streaming AI response.'
            });
        }

        return res.end();
    }
};

module.exports = {
    solveDoubt,
    solveDoubtStream
};
