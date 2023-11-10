const db = require("../query");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

let refreshTokens = [];
const authController = {
  registerUser: async (req, res) => {
    try {
      const oldUsername = await db.query(
        'select "username" from public."Users" where "username" = $1',
        [`${req.body.username}`]
      );
      if (oldUsername.rows.length > 0)
        return res.status(404).json("This username is already in use");
      const oldEmail = await db.query(
        'select "email" from public."Users" where "email" = $1',
        [`${req.body.email}`]
      );
      if (oldEmail.rows.length > 0)
        return res.status(404).json("This email is already in use");
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);
      await db.query(
        'INSERT INTO public."Users"(username, password, email, admin) VALUES ($1, $2, $3, $4);',
        [
          `${req.body.username}`,
          `${hashedPassword}`,
          `${req.body.email}`,
          `${req.body.admin}`,
        ]
      );
      return res.status(200).json("register successfully");
    } catch (error) {
      res.status(500).json(error);
    }
  },
  generateAccessToken: (user) => {
    return jwt.sign(
      {
        username: user.username,
        admin: user.admin,
      },
      process.env.JWT_ACCESS_KEY,
      {
        expiresIn: "300s",
      }
    );
  },
  generateRefreshToken: (user) => {
    return jwt.sign(
      {
        username: user.username,
        admin: user.admin,
      },
      process.env.JWT_REFRESH_KEY,
      {
        expiresIn: "365d",
      }
    );
  },
  loginUser: async (req, res) => {
    try {
      const user = await db.query(
        'select * from public."Users" where "username" = $1',
        [`${req.body.username}`]
      );
      if (user.rows.length === 0)
        return res.status(404).json("This username is not registered");
      const validPassword = await bcrypt.compare(
        req.body.password,
        user.rows[0].password
      );
      if (!validPassword) return res.status(404).json("Incorrect password");
      const { password, ...others } = user.rows[0];
      const accessToken = authController.generateAccessToken(user.rows[0]);
      const refreshToken = authController.generateRefreshToken(user.rows[0]);
      refreshTokens.push(refreshToken);
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        path: "/",
        sameSite: "strict",
      });
      return res.status(200).json({ ...others, accessToken });
    } catch (error) {
      res.status(500).json(error);
    }
  },
  requestRefreshToken: (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json("Authentication required");
    if (!refreshTokens.includes(refreshToken)) return res.status(403).json("refresh token is not valid");
    jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY, (err, user) => {
      if (err) return res.status(403).json("refresh token is not valid");
      refreshTokens = refreshTokens.filter(token => token !== refreshToken);
      const newAccessToken = authController.generateAccessToken(user);
      const newRefreshToken = authController.generateRefreshToken(user);
      refreshTokens.push(newRefreshToken);
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: true,
        path: "/",
        sameSite: "strict"
      });
      res.status(200).json({newAccessToken});
    })
  },
  logoutUser: (req, res) => {
    res.clearCookie("refreshToken");
    refreshTokens = refreshTokens.filter(token !== req.cookies.refreshToken);
    return res.status(200).json("logged out successfully");
  },
  loggedInUser: (req, res) => {
    const token = req.headers.token;
    if (!token) return res.status(401).json("Authentication required");
    jwt.verify(token.split(" ")[1], process.env.JWT_ACCESS_KEY, (err, user) => {
      if (err) return res.status(403).json("Token is not valid");
      return res.status(200).json("Logged in");
    })
  }
};

module.exports = authController;
