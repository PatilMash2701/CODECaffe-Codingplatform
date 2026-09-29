const jwt = require('jsonwebtoken');
const User = require('../models/user');

const adminMiddleware = async (req, res, next) => {
    try {
        const { token } = req.cookies;
        
        if (!token) {
            return res.status(401).json({ error: "Authentication required" });
        }

        try {
            // Verify the token
            const payload = jwt.verify(token, process.env.JWT_KEY);
            const { _id, role, tokenVersion } = payload;

            if (!_id) {
                return res.status(400).json({ error: "Invalid token format" });
            }

            if (role !== 'admin') {
                return res.status(403).json({ error: "Admin access required" });
            }

            // Get the user and verify token version
            const user = await User.findById(_id);
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            // Check if token version matches
            if (user.tokenVersion !== tokenVersion) {
                return res.status(401).json({ error: "Session expired. Please login again." });
            }

            // Attach user to request object
            req.user = user;
            req.result = user;
            next();
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({ error: "Token expired" });
            }
            return res.status(401).json({ error: "Invalid token" });
        }
    } catch (err) {
        console.error("Admin middleware error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = adminMiddleware;