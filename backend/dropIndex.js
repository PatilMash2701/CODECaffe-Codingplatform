require('dotenv').config();
const mongoose = require('mongoose');

async function dropIndex() {
  try {
    await mongoose.connect(process.env.DB_CONNECT_STRING);
    const db = mongoose.connection.db;
    await db.collection('users').dropIndex('problemSolved_1');
    console.log('Index dropped successfully');
  } catch (err) {
    console.error('Error dropping index:', err);
  } finally {
    mongoose.disconnect();
  }
}

dropIndex();