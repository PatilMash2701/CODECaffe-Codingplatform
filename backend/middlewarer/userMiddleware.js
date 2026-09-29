const jwt = require('jsonwebtoken');
const User = require('../models/user');

const userMiddleware = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        const token = authHeader.split(' ')[1];
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_KEY || 'b903a0516a488eb7f30997f4a9d5c6b37294b3768b1');
        
        // Find user and attach to request
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        
        req.user = user;
        req.result = user; // For backward compatibility
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

module.exports = userMiddleware;
