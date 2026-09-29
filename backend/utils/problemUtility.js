// This file exports utilities from judge0Utility for backward compatibility
const { getLanguageById, submitBatch, submitToken } = require('./judge0Utility');

module.exports = {
    getLanguageById,
    submitBatch,
    submitToken
};
