const mongoose = require('mongoose');

async function main() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/leetcode', {
            // useNewUrlParser: true,
            // useUnifiedTopology: true
        });
        console.log("Database connected successfully");
    } catch (error) {
        console.error("Database connection error:", error);
        process.exit(1); // Exit if connection fails
    }
}

// Don't call main() here, let the importing file handle it


module.exports = main;
