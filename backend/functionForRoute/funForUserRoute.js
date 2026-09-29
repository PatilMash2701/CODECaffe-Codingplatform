const User = require('../models/user');
const Problem = require('../models/problem');
const validate = require('../utils/validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Submission = require('../models/submission');

const register = async (req, res) => {
    try {
        // Validate the data
        validate(req.body);

        const { firstName, emailId, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ emailId });
        if (existingUser) {
            return res.status(400).json({ error: "User with this email already exists" });
        }


        req.body.password = await bcrypt.hash(password, 10);
        req.body.role = 'user'

        const user = await User.create(req.body);
        
        // Create JWT token
        const token = jwt.sign(
            {
                _id: user._id,
                emailId: user.emailId,
                role: user.role,
                tokenVersion: user.tokenVersion
            },
            process.env.JWT_KEY,
            { expiresIn: 60*60 }
        );

        const reply = {
            firstName: user.firstName,
            emailId: user.emailId,
            _id: user._id,
            role:user.role,
        };

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: "/"
        });
        
        res.status(201).json({
            user: reply,
            message: "Registered Successfully"
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(400).json({ error: "Registration failed: " + err.message });
    }
};

const login = async (req, res) => {
    try {
        const { emailId, password } = req.body;
        
        if (!emailId || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const user = await User.findOne({ emailId });
        if (!user) {
            return res.status(401).json({ error: "user not found with this email Id " });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: "Password Doesnt get matched" });
        }

        // Generate token with token version
        const token = jwt.sign(
            {
                _id: user._id,
                emailId: user.emailId,
                role: user.role,
                tokenVersion: user.tokenVersion
            },
            process.env.JWT_KEY,
            { expiresIn: '1h' }
        );

        const reply = {
            firstName: user.firstName,
            emailId: user.emailId,
            _id: user._id,
            role: user.role
        };

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: "/"
        });
        
        res.status(200).json({
            user: reply,
            message: "Login Successful"
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: "Login failed" });
    }
};

// Logout feature using token versioning
const logout = async (req, res) => {
    try {
        const { token } = req.cookies;
        
        if (!token) {
            return res.status(200).json({ message: 'Already logged out' });
        }

        try {
            // Verify the token to get user ID
            const payload = jwt.verify(token, process.env.JWT_KEY);
            const { _id } = payload;

            // Increment the token version to invalidate all existing tokens
            await User.findByIdAndUpdate(_id, { $inc: { tokenVersion: 1 } });

            // Clear the token cookie
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/'
            });

            res.status(200).json({ message: 'Successfully logged out' });
        } catch (jwtError) {
            // If token is invalid/expired, still clear the cookie
            if (jwtError.name === 'JsonWebTokenError' || jwtError.name === 'TokenExpiredError') {
                res.clearCookie('token', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    path: '/'
                });
                return res.status(200).json({ message: 'Session cleared' });
            }
            throw jwtError;
        }
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ error: 'Error during logout' });
    }
};

const adminRegister = async (req, res) => {
    try {
        validate(req.body);
        const { firstName, emailId, password } = req.body;
        
        req.body.password = await bcrypt.hash(password, 10);
        req.body.role = 'admin';
        
        const user = await User.create(req.body);
        
        const token = jwt.sign(
            {
                _id: user._id,
                emailId: user.emailId,
                role: user.role,
                tokenVersion: user.tokenVersion
            },
            process.env.JWT_KEY,
            { expiresIn: '1h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: "/"
        });
        
        res.status(201).json({ message: "Admin registered successfully" });
    } catch (err) {
        console.error('Admin registration error:', err);
        res.status(400).json({ error: "Admin registration failed: " + err.message });
    }
};

const deleteProfile = async (req, res) => {
    try {
        const userId = req.user._id; // From the authenticated request
        await User.findByIdAndDelete(userId);
        
        // Clear the token cookie
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/'
        });
        
        res.status(200).json({ message: "Profile deleted successfully" });
    } catch (err) {
        console.error('Delete profile error:', err);
        res.status(500).json({ error: "Failed to delete profile" });
    }
};

const getRole = async (req, res) => {
    try {
        res.json({ role: req.user.role });
    } catch (err) {
        console.error('Get role error:', err);
        res.status(500).json({ error: "Failed to get user role" });
    }
};

/** All users for Friends list (safe fields only) */
const listUsers = async (req, res) => {
    try {
        const currentUserId = req.result._id.toString();
        const users = await User.find({})
            .select('firstName lastName problemSolved createdAt')
            .sort({ firstName: 1 })
            .lean();

        const data = users.map((u) => ({
            _id: u._id,
            firstName: u.firstName,
            lastName: u.lastName || '',
            solvedCount: Array.isArray(u.problemSolved) ? u.problemSolved.length : 0,
            isSelf: u._id.toString() === currentUserId,
        }));

        return res.status(200).json({ data });
    } catch (err) {
        console.error('listUsers error:', err);
        return res.status(500).json({ error: 'Failed to load users' });
    }
};

/** Public profile for any user (LeetCode-style) */
const getPublicProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ error: 'User id is required' });
        }

        const user = await User.findById(userId)
            .select('firstName lastName emailId problemSolved createdAt')
            .populate({
                path: 'problemSolved',
                select: '_id title difficulty tags',
            });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const allProblems = await Problem.find({}).select('_id difficulty');
        const submissions = await Submission.find({ userId: user._id })
            .sort({ updatedAt: -1 })
            .populate('problemId', 'title difficulty');

        const isOwnProfile = req.result._id.toString() === user._id.toString();

        return res.status(200).json({
            data: {
                user: {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName || '',
                    emailId: isOwnProfile ? user.emailId : undefined,
                    createdAt: user.createdAt,
                },
                solvedProblems: user.problemSolved || [],
                submissions,
                totalProblems: allProblems.length,
                isOwnProfile,
            },
        });
    } catch (err) {
        console.error('getPublicProfile error:', err);
        return res.status(500).json({ error: 'Failed to load profile' });
    }
};

module.exports = {
    register,
    login,
    logout,
    adminRegister,
    deleteProfile,
    getRole,
    listUsers,
    getPublicProfile,
};