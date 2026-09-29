const mongoose = require('mongoose');
const express = require('express');
const app = express();

async function testConnection() {
    try {
        // Using 127.0.0.1 instead of localhost to avoid IPv6 issues
        await mongoose.connect('mongodb://127.0.0.1:27017/leetcode', {
            // useNewUrlParser: true,
            // useUnifiedTopology: true
        });
        console.log('MongoDB connection successful to database: leetcode');

        const testSchema = new mongoose.Schema({ name: String });
        const test = mongoose.model('Test', testSchema);

        const testDoc = new test({ name: 'test' });
        await testDoc.save();
        console.log("Successfully created test document");

        app.listen(3000, () => {
            console.log("listening at the port 3000");
        });

    } catch (error) {
        console.error("MongoDB Connection error:", error);
        process.exit(1); // Exit if connection fails
    }
}

testConnection();