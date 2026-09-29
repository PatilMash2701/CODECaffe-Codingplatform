const mongoose = require('mongoose');
const Problem = require("../models/problem");
const Submission = require("../models/submission");
const User = require("../models/user");
const { getLanguageById, submitBatch, submitToken } = require("../utils/problemUtility");
const { sseEmitter, sendSSE } = require("../utils/sseManager");

// In-memory cache for recent execution results to handle any race condition
// where execution finishes before the client SSE connection is established.
const executionResultsCache = new Map();

// Helper to store in cache with automatic expiration (2 minutes TTL)
const cacheExecutionResult = (id, result) => {
    const key = id.toString();
    executionResultsCache.set(key, result);
    setTimeout(() => {
        executionResultsCache.delete(key);
    }, 2 * 60 * 1000);
};

const extractSubmissionTokens = (batchResponse) => {
    const list = Array.isArray(batchResponse)
        ? batchResponse
        : batchResponse?.submissions;
    if (!Array.isArray(list) || list.length === 0) {
        throw new Error('Invalid response from Judge0 batch submit');
    }
    return list.map((item) => item.token);
};

/**
 * SSE Streaming Endpoint for Real-time Execution Updates
 * Route: GET /submission/stream/:submissionId
 */
const streamSubmissionEvents = async (req, res) => {
    const { submissionId } = req.params;

    if (!submissionId) {
        return res.status(400).json({ error: "submissionId is required" });
    }

    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx proxy buffering

    if (typeof res.flushHeaders === 'function') {
        res.flushHeaders();
    }

    // Initial connection acknowledgment
    sendSSE(res, 'connected', {
        message: 'SSE stream connected',
        submissionId,
        timestamp: new Date().toISOString()
    });

    const key = submissionId.toString();

    // 1. Check if result is already in memory cache
    if (executionResultsCache.has(key)) {
        const cachedResult = executionResultsCache.get(key);
        sendSSE(res, 'completed', cachedResult);
        return res.end();
    }

    // 2. Check if it's an existing completed MongoDB submission
    if (mongoose.Types.ObjectId.isValid(submissionId)) {
        try {
            const existingSub = await Submission.findById(submissionId);
            if (existingSub && existingSub.status !== 'pending') {
                sendSSE(res, 'completed', {
                    mode: 'submit',
                    accepted: existingSub.status === 'accepted',
                    status: existingSub.status,
                    totalTestCases: existingSub.testCasesTotal,
                    passedTestCases: existingSub.testCasesPassed,
                    runtime: existingSub.runtime,
                    memory: existingSub.memory,
                    errorMessage: existingSub.errorMessage,
                    testResults: []
                });
                return res.end();
            }
        } catch (dbErr) {
            console.error('Error checking existing submission in SSE stream:', dbErr);
        }
    }

    // 3. Set up event listener for active execution
    const eventHandler = (payload) => {
        if (payload.submissionId === key) {
            sendSSE(res, payload.event, payload.data);

            if (payload.event === 'completed' || payload.event === 'error') {
                // End response on terminal event
                res.end();
            }
        }
    };

    sseEmitter.on('submission_update', eventHandler);

    // Heartbeat keep-alive every 15s to prevent proxy connection drop
    const heartbeat = setInterval(() => {
        if (res.writableEnded || res.finished) {
            clearInterval(heartbeat);
            return;
        }
        res.write(': keep-alive\n\n');
    }, 15000);

    // Clean up when client disconnects
    req.on('close', () => {
        clearInterval(heartbeat);
        sseEmitter.removeListener('submission_update', eventHandler);
    });
};

/**
 * Background Asynchronous Processor for Submissions
 */
const processSubmissionAsync = async (submissionId, problem, code, language, userId, problemId) => {
    const subIdStr = submissionId.toString();

    try {
        // Step 1: Queued event
        sseEmitter.emit('submission_update', {
            submissionId: subIdStr,
            event: 'status',
            data: { status: 'QUEUED', message: 'Submitting code to Judge0 execution cluster...' }
        });

        const langKey = language === 'cpp' ? 'c++' : language;
        const languageId = getLanguageById(langKey);

        const submissions = problem.hiddenTestCases.map((testcase) => ({
            source_code: code,
            language_id: languageId,
            stdin: testcase.input,
            expected_output: testcase.output
        }));

        // Step 2: Compiling event
        sseEmitter.emit('submission_update', {
            submissionId: subIdStr,
            event: 'status',
            data: { status: 'COMPILING', message: 'Compiling and preparing test cases...' }
        });

        const submitResult = await submitBatch(submissions);
        const resultTokens = extractSubmissionTokens(submitResult);

        // Step 3: Polling tokens with live progress events
        const testResult = await submitToken(resultTokens, (progress) => {
            sseEmitter.emit('submission_update', {
                submissionId: subIdStr,
                event: 'progress',
                data: {
                    status: 'RUNNING',
                    message: `Executing test cases (${progress.completedCount}/${progress.totalCount})`,
                    completedCount: progress.completedCount,
                    totalCount: progress.totalCount
                }
            });
        });

        // Step 4: Evaluate results
        let testCasesPassed = 0;
        let runtime = 0;
        let memory = 0;
        let status = 'accepted';
        let errorMessage = null;

        for (const test of testResult) {
            if (test.status_id === 3) {
                testCasesPassed++;
                runtime += parseFloat(test.time) || 0;
                memory = Math.max(memory, test.memory || 0);
            } else {
                if (test.status_id === 4) {
                    status = 'error';
                    errorMessage = test.stderr || test.compile_output || 'Runtime Error';
                } else {
                    status = 'wrong';
                    errorMessage = test.stderr || test.compile_output || test.message || 'Wrong Answer';
                }
            }
        }

        // Step 5: Save result to MongoDB
        await Submission.findByIdAndUpdate(submissionId, {
            status,
            testCasesPassed,
            errorMessage,
            runtime,
            memory
        });

        // Update user's solved problems if accepted
        if (status === 'accepted') {
            try {
                const problemObjectId = typeof problemId === 'string'
                    ? new mongoose.Types.ObjectId(problemId)
                    : problemId;

                await User.findByIdAndUpdate(
                    userId,
                    { $addToSet: { problemSolved: problemObjectId } },
                    { new: true }
                );
            } catch (userErr) {
                console.error('Error updating user solved problems:', userErr);
            }
        }

        const accepted = (status === 'accepted');
        const finalResult = {
            mode: 'submit',
            accepted,
            status,
            totalTestCases: problem.hiddenTestCases.length,
            passedTestCases: testCasesPassed,
            runtime,
            memory,
            errorMessage: accepted ? null : errorMessage,
            testResults: testResult
        };

        // Cache result for quick retrieval
        cacheExecutionResult(subIdStr, finalResult);

        // Step 6: Emit terminal completed event
        sseEmitter.emit('submission_update', {
            submissionId: subIdStr,
            event: 'completed',
            data: finalResult
        });

    } catch (err) {
        console.error(`Error in processSubmissionAsync [${subIdStr}]:`, err);
        const errorPayload = {
            mode: 'submit',
            accepted: false,
            status: 'error',
            errorMessage: err.message || 'Internal execution error',
            details: err.message
        };

        cacheExecutionResult(subIdStr, errorPayload);

        // Update MongoDB if possible
        try {
            await Submission.findByIdAndUpdate(submissionId, {
                status: 'error',
                errorMessage: err.message
            });
        } catch (_) {}

        sseEmitter.emit('submission_update', {
            submissionId: subIdStr,
            event: 'error',
            data: errorPayload
        });
    }
};

/**
 * Background Asynchronous Processor for Run Code (Visible Test Cases)
 */
const processRunAsync = async (runId, problem, code, language, userId) => {
    const runIdStr = runId.toString();

    try {
        sseEmitter.emit('submission_update', {
            submissionId: runIdStr,
            event: 'status',
            data: { status: 'QUEUED', message: 'Preparing visible test cases...' }
        });

        const langKey = language === 'cpp' ? 'c++' : language;
        const languageId = getLanguageById(langKey);

        const submissions = problem.visibleTestCases.map((testcase) => ({
            source_code: code,
            language_id: languageId,
            stdin: testcase.input,
            expected_output: testcase.output
        }));

        sseEmitter.emit('submission_update', {
            submissionId: runIdStr,
            event: 'status',
            data: { status: 'COMPILING', message: 'Compiling code...' }
        });

        const submitResult = await submitBatch(submissions);
        const resultTokens = extractSubmissionTokens(submitResult);

        const testResult = await submitToken(resultTokens, (progress) => {
            sseEmitter.emit('submission_update', {
                submissionId: runIdStr,
                event: 'progress',
                data: {
                    status: 'RUNNING',
                    message: `Executing test case ${progress.completedCount} of ${progress.totalCount}`,
                    completedCount: progress.completedCount,
                    totalCount: progress.totalCount
                }
            });
        });

        let testCasesPassed = 0;
        let runtime = 0;
        let memory = 0;
        let errorMessage = null;

        for (const test of testResult) {
            if (test.status_id === 3) {
                testCasesPassed++;
                runtime += parseFloat(test.time) || 0;
                memory = Math.max(memory, test.memory || 0);
            } else if (!errorMessage) {
                errorMessage =
                    test.stderr ||
                    test.compile_output ||
                    test.message ||
                    `Test failed (status ${test.status_id})`;
            }
        }

        const totalTestCases = problem.visibleTestCases.length;
        const accepted = testCasesPassed === totalTestCases;

        const finalResult = {
            mode: 'run',
            accepted,
            passedTestCases: testCasesPassed,
            totalTestCases,
            runtime,
            memory,
            errorMessage: accepted ? null : errorMessage,
            testResults: testResult.map((test, index) => ({
                ...test,
                testIndex: index + 1,
                input: problem.visibleTestCases[index]?.input,
                expected: problem.visibleTestCases[index]?.output
            }))
        };

        cacheExecutionResult(runIdStr, finalResult);

        sseEmitter.emit('submission_update', {
            submissionId: runIdStr,
            event: 'completed',
            data: finalResult
        });

    } catch (err) {
        console.error(`Error in processRunAsync [${runIdStr}]:`, err);
        const errorPayload = {
            mode: 'run',
            accepted: false,
            status: 'error',
            errorMessage: err.message || 'Run failed',
            details: err.message
        };

        cacheExecutionResult(runIdStr, errorPayload);

        sseEmitter.emit('submission_update', {
            submissionId: runIdStr,
            event: 'error',
            data: errorPayload
        });
    }
};

/**
 * POST /submission/submit/:id
 * Creates submission and returns 202 Accepted with submissionId immediately for SSE streaming
 */
const submitCode = async (req, res) => {
    try {
        const userId = req.result._id;
        const problemId = req.params.id;
        let { code, language } = req.body;

        if (!userId || !code || !problemId || !language) {
            return res.status(400).json({
                error: "Some field missing",
                details: { userId: !!userId, code: !!code, problemId: !!problemId, language: !!language }
            });
        }

        if (!code.trim()) {
            return res.status(400).json({ error: "Code cannot be empty" });
        }

        if (language === 'cpp') {
            language = 'c++';
        }

        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).json({ error: "Problem not found" });
        }

        // Store initial submission record in Database
        const submittedResult = await Submission.create({
            userId,
            problemId,
            code,
            language,
            status: 'pending',
            testCasesTotal: problem.hiddenTestCases ? problem.hiddenTestCases.length : 0
        });

        // Respond immediately with 202 Accepted and submissionId
        res.status(202).json({
            success: true,
            submissionId: submittedResult._id,
            mode: 'submit',
            message: 'Submission accepted for execution. Connect to /submission/stream/:submissionId for real-time progress.'
        });

        // Execute in background
        processSubmissionAsync(submittedResult._id, problem, code, language, userId, problemId);

    } catch (err) {
        console.error("Error in submitCode:", err);
        return res.status(500).json({ error: "Internal Server Error", details: err.message });
    }
};

/**
 * POST /submission/run/:id
 * Generates runId and returns 202 Accepted immediately for SSE streaming
 */
const runCode = async (req, res) => {
    try {
        const userId = req.result._id;
        const problemId = req.params.id;
        let { code, language } = req.body;

        if (!userId || !code || !problemId || !language) {
            return res.status(400).json({
                error: 'Some field missing',
                details: {
                    userId: !!userId,
                    code: !!code,
                    problemId: !!problemId,
                    language: !!language,
                },
            });
        }

        if (!code.trim()) {
            return res.status(400).json({ error: 'Code cannot be empty' });
        }

        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        if (
            !problem.visibleTestCases ||
            !Array.isArray(problem.visibleTestCases) ||
            problem.visibleTestCases.length === 0
        ) {
            return res.status(400).json({
                error: 'This problem has no visible test cases to run against',
            });
        }

        if (language === 'cpp') {
            language = 'c++';
        }

        // Generate unique runId
        const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Respond immediately with 202 Accepted
        res.status(202).json({
            success: true,
            submissionId: runId,
            mode: 'run',
            message: 'Code run task accepted. Connect to /submission/stream/:submissionId for real-time progress.'
        });

        // Execute in background
        processRunAsync(runId, problem, code, language, userId);

    } catch (err) {
        console.error('Error in runCode:', err);
        return res.status(500).json({
            error: 'Run failed',
            details: err.message,
        });
    }
};

module.exports = {
    submitCode,
    runCode,
    streamSubmissionEvents
};