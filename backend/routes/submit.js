const express = require('express');
const submitRouter = express.Router();
const userMiddleware = require('../middleware/userMiddleware');
const { submitCode, runCode, streamSubmissionEvents } = require('../functionForRoute/funForSubmitProblem');

submitRouter.post("/submit/:id", userMiddleware, submitCode);
submitRouter.post("/run/:id", userMiddleware, runCode);
submitRouter.get("/stream/:submissionId", userMiddleware, streamSubmissionEvents);

module.exports = submitRouter;
