const express = require('express');
const app = express();
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');
const authRouter = require("./routes/userRoute");
const problemRouter = require('./routes/problemRoute');
const submitRouter = require('./routes/submit');
const aiRouter = require('./routes/aiRoute');
const cors = require('cors');
const path = require('path');



app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') }); // Load environment variables from root .env

//give fronted access to backend
const _dirname = path.resolve();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Error handling for JSON parsing
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Invalid JSON received', details: err.message });
    }
    next(err);
});

// Routes
app.use('/user', authRouter);
app.use('/problem', problemRouter);
app.use('/submission', submitRouter);
app.use('/ai', aiRouter);

app.use(express.static(path.join(_dirname, "/frontend/dist")));  //becuase dist have bundled files of frontend used for production
app.get('*', (req,res)=> {
    res.sendFile(path.resolve(_dirname, "frontend" , "dist" , "index.html")); //if above routers doent get matched direct oprn the fronted(frontend/dist/index.html) file as default route
})

const initializeConnection = async () => {
    try {
        // Connect to MongoDB
        await connectDB();
        console.log("✅ MongoDB database connected");
        
        // Start the server
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
        });
    } catch(err) {
        console.error("❌ Connection Error: ", err);
        process.exit(1); // Exit if MongoDB connection fails
    }
};

initializeConnection();
