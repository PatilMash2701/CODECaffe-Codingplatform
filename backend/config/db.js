const mongoose = require('mongoose');
require('dotenv').config();

async function connectDB() {
    try {
        const dbName = 'Leetcode'; // Replace with your actual database name
        await mongoose.connect(
            `mongodb+srv://702083m_db_user:tKWc3PAFl8ZVT8oo@cluster0.590cbug.mongodb.net/${dbName}?retryWrites=true&w=majority`
        );
        console.log("✅ Successfully connected to MongoDB!");
        
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("Available collections:", collections.map(c => c.name));
        
        return mongoose.connection;
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
}

module.exports = connectDB;