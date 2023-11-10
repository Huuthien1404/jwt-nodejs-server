const jwt = require("jsonwebtoken");
require("dotenv").config();

const middlewareController = {
    verifyToken: (req, res, next) => {
        const token = req.headers.token;
        if (!token) return res.status(401).json("Authentication required");
        jwt.verify(token.split(" ")[1], process.env.JWT_ACCESS_KEY, (err, user) => {
            if (err) return res.status(403).json("Token is not valid");
            req.user = user;
            next();
        });
    },
    verifyTokenForDeleteUser: (req, res, next) => {
        const token = req.headers.token;
        if (!token) return res.status(401).json("Authentication required");
        jwt.verify(token.split(" ")[1], process.env.JWT_ACCESS_KEY, (err, user) => {
            if (err) return res.status(403).json("Token is not valid");
            req.user = user;
            if (req.user.username === req.params.username || req.user.admin === true) {
                next();
            }
            else {
                return res.status(403).json("You are not allowed to delete user");
            }
        })
    }
}

module.exports = middlewareController;