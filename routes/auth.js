const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const authenticateToken = require("../middleware/auth");

const JWT_SECRET = process.env.JWT_SECRET;


// Get All Users
router.get("/users", async (req, res) => {
    try {
        const [results] = await pool.query(
            "SELECT id, name, email FROM users"
        );
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch users" });
    }
});


// Register User
router.post("/users", async (req, res) => {

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            message: "Name, email and password are required"
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            message: "Password must be at least 6 characters long"
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            message: "Please provide a valid email address"
        });
    }

    try {

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            [name, email, hashedPassword]
        );

        res.status(201).json({
            message: "User created successfully",
            userId: result.insertId
        });

    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Email already exists"
            });
        }
        res.status(500).json({ message: "Failed to create user" });
    }

});


// Login User
router.post("/login", async (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    try {

        const [results] = await pool.query(
            "SELECT id, name, email, password FROM users WHERE email = ?",
            [email]
        );

        if (results.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = results[0];

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({
            message: "Login successful",
            token: token,
            user: { id: user.id, name: user.name, email: user.email }
        });

    } catch (err) {
        res.status(500).json({ message: "Login failed" });
    }

});


// Protected Profile Route
router.get("/profile", authenticateToken, (req, res) => {
    res.json({
        message: "You accessed a protected route!",
        user: req.user
    });
});


module.exports = router;