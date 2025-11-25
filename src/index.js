const express=require('express');
const app=express();
const main=require('./config/db');
const cookieParser = require('cookie-parser');
const authRouter=require("./routes/userRoute");
const redisClient=require('./config/redis');
const problemRouter=require('./routes/problemRoute');
const submitRouter=require('./routes/submit');
const cors=require('cors');

app.use(cors({
    origin:'http://localhost:5173',
    credentials:true
}))

require('dotenv').config(); // Load environment variables first

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/user',authRouter);
app.use('/problem',problemRouter);
app.use('/submission',submitRouter);

const InitalizeConnection=async()=>{
    try{
        // Connect to MongoDB
        await main();
        console.log("MongoDB database connected");
        
        // Try to connect to Redis (don't block server start if it fails)
        // Set DISABLE_REDIS=true in .env to skip Redis connection
        if (process.env.DISABLE_REDIS === 'true') {
            console.log("Redis is disabled via DISABLE_REDIS environment variable");
        } else {
            try {
                await redisClient.connect();
                console.log("Redis connected");
            } catch (redisError) {
                console.warn("Redis connection failed, continuing without Redis:", redisError.message);
                console.log("Server will continue to run without Redis cache");
                console.log("To disable Redis completely, set DISABLE_REDIS=true in your .env file");
            }
        }
        
        app.listen(process.env.PORT,()=>{
            console.log("server listening at port number: "+process.env.PORT);
        })

    }catch(err){
        console.error("Connection Error : ",err);
        process.exit(1); // Exit if MongoDB connection fails
    }
};

InitalizeConnection();
