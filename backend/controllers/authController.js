const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");


// --------------------------------------------------
// Generate JWT
// --------------------------------------------------

const generateToken = (user) => {
    return jwt.sign(
        {
            userId: user._id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );
};


// --------------------------------------------------
// Register
// POST /api/auth/register
// --------------------------------------------------

const register = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            clubId
        } = req.body;


        // Basic validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }


        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }


        // Check existing user
        const existingUser = await User.findOne({
            email: email.toLowerCase().trim()
        });


        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User with this email already exists"
            });
        }


        // Hash password
        const passwordHash = await bcrypt.hash(
            password,
            10
        );


        // IMPORTANT:
        // Every newly registered user is a MEMBER.
        // Client cannot create admin/organizer accounts.
        const user = await User.create({
            name: name.trim(),

            email: email
                .toLowerCase()
                .trim(),

            passwordHash,

            role: "member",

            clubId: clubId || undefined
        });


        const token = generateToken(user);


        return res.status(201).json({
            success: true,
            message: "Registration successful",

            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    clubId: user.clubId
                },

                token
            }
        });

    } catch (error) {

        console.error(
            "Register error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Registration failed",
            error: error.message
        });
    }
};


// --------------------------------------------------
// Login
// POST /api/auth/login
// --------------------------------------------------

const login = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;


        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }


        // passwordHash has select:false,
        // so explicitly select it here.
        const user = await User.findOne({
            email: email.toLowerCase().trim()
        }).select("+passwordHash");


        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }


        const passwordMatch =
            await bcrypt.compare(
                password,
                user.passwordHash
            );


        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }


        const token = generateToken(user);


        return res.json({
            success: true,
            message: "Login successful",

            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    clubId: user.clubId
                },

                token
            }
        });

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Login failed",
            error: error.message
        });
    }
};


// --------------------------------------------------
// Get current user
// GET /api/auth/me
// --------------------------------------------------

const getMe = async (req, res) => {
    try {

        const user = await User.findById(
            req.user.userId
        )
            .populate(
                "clubId",
                "name description adminId"
            );


        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }


        return res.json({
            success: true,
            data: {
                user
            }
        });

    } catch (error) {

        console.error(
            "Get current user error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to get user",
            error: error.message
        });
    }
};


module.exports = {
    register,
    login,
    getMe
};