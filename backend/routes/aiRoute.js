const express = require('express');
const aiRouter = express.Router();
const userMiddleware = require('../middleware/userMiddleware');
const { solveDoubt, solveDoubtStream } = require('../functionForRoute/funForAI');

// Standard non-streaming chat endpoint
aiRouter.post('/chat', userMiddleware, solveDoubt);

// Real-time SSE streaming chat endpoint
aiRouter.post('/chat-stream', userMiddleware, solveDoubtStream);

module.exports = aiRouter;
