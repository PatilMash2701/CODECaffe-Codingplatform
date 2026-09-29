const jwt = require('jsonwebtoken');
const User = require('../models/user');

const userMiddleware = async (req, res, next) => {
    try {
        let token = req.cookies?.token;
        if (!token && req.headers?.authorization) {
            token = req.headers.authorization.startsWith('Bearer ')
                ? req.headers.authorization.substring(7)
                : req.headers.authorization;
        }
        if (!token && req.query?.token) {
            token = req.query.token;
        }

        if (!token) {
            return res.status(401).json({ error: "Authentication required" });
        }

        try {
            // Verify the token
            const payload = jwt.verify(token, process.env.JWT_KEY);
            const { _id, tokenVersion } = payload;

            if (!_id) {
                return res.status(400).json({ error: "Invalid token format" });
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
            // Attach user to both `req.user` and legacy `req.result` to support handlers
            // that expect either property.
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
        console.error("Middleware error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = userMiddleware;