const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // Check Authorization header
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
                error: {
                    code: "NO_TOKEN"
                }
            });
        }

        // Extract token
        const token = authHeader.split(" ")[1];

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Attach user information
        req.user = {
            userId: decoded.userId,
            role: decoded.role
        };

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
            error: {
                code: "INVALID_TOKEN"
            }
        });
    }
};

module.exports = {
    protect
};