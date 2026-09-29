const EventEmitter = require('events');

class SSEManager extends EventEmitter {}
const sseEmitter = new SSEManager();

// Increase max listeners to prevent warnings with many concurrent streams
sseEmitter.setMaxListeners(200);

/**
 * Format and write an SSE message to an Express response stream
 * @param {import('express').Response} res Express response object
 * @param {string} event Event name
 * @param {object|string} data Payload to send
 * @param {string|number} [id] Optional event ID
 */
const sendSSE = (res, event, data, id = null) => {
    if (res.writableEnded || res.finished) return;
    
    if (id !== null && id !== undefined) {
        res.write(`id: ${id}\n`);
    }
    if (event) {
        res.write(`event: ${event}\n`);
    }
    const payload = typeof data === 'object' ? JSON.stringify(data) : data;
    res.write(`data: ${payload}\n\n`);
};

module.exports = {
    sseEmitter,
    sendSSE
};
