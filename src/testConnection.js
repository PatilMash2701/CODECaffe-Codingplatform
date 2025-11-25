const mongoose = require('mongoose');

async function testConnection() {
    try {
        await mongoose.connect('mongodb://localhost:27017/test');
        console.log('MongoDB connection successful!');
        
        // Test database operations
        const testSchema = new mongoose.Schema({ name: String });
        const Test = mongoose.model('Test', testSchema);
        
        // Try to create a test document
        const testDoc = new Test({ name: 'test' });
        await testDoc.save();
        console.log('Successfully created test document');
        
        // Try to read the test document
        const foundDoc = await Test.findOne({ name: 'test' });
        console.log('Successfully read test document:', foundDoc);
        
        // Clean up
        await Test.deleteOne({ name: 'test' });
        console.log('Successfully cleaned up test document');
        
    } catch (error) {
        console.error('MongoDB connection error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB connection closed');
    }
}

testConnection(); 