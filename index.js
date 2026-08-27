require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;


// MySQL Connection

const db = mysql.createConnection({
    host: process.env.MYSQLHOST,
    port: process.env.MYSQLPORT,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    ssl: {
        rejectUnauthorized: false
    }
});

db.connect((err) => {

    if (err) {
        console.log("MySQL connection failed:", err.message);
        return;
    }

    console.log("MySQL connected successfully!");

});


// Home Route

app.get("/", (req, res) => {

    res.send("Node.js + MySQL server is working!");

});


// Get All Users

app.get("/users", (req, res) => {

    const sql = "SELECT id, name, email FROM users";

    db.query(sql, (err, results) => {

        if (err) {

            return res.status(500).json({
                message: "Failed to fetch users"
            });

        }

        res.json(results);

    });

});


// Register User

app.post("/users", (req, res) => {

    const { name, email, password } = req.body;


    // Input validation

    if (!name || !email || !password) {

        return res.status(400).json({
            message: "Name, email and password are required"
        });

    }


    // Password length validation

    if (password.length < 6) {

        return res.status(400).json({
            message: "Password must be at least 6 characters long"
        });

    }


    // Email format validation

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {

        return res.status(400).json({
            message: "Please provide a valid email address"
        });

    }


    // Hash password

    const hashedPassword = bcrypt.hashSync(password, 10);


    const sql =
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";


    db.query(
        sql,
        [name, email, hashedPassword],
        (err, result) => {

            if (err) {

                console.log("Insert failed:", err.message);


                // Duplicate email

                if (err.code === "ER_DUP_ENTRY") {

                    return res.status(409).json({
                        message: "Email already exists"
                    });

                }


                return res.status(500).json({
                    message: "Failed to create user"
                });

            }


            res.status(201).json({

                message: "User created successfully",

                userId: result.insertId

            });

        }
    );

});


// Login User

app.post("/login", (req, res) => {

    const { email, password } = req.body;


    // Login input validation

    if (!email || !password) {

        return res.status(400).json({
            message: "Email and password are required"
        });

    }


    const sql =
        "SELECT id, name, email, password FROM users WHERE email = ?";


    db.query(sql, [email], (err, results) => {

        if (err) {

            return res.status(500).json({
                message: "Login failed"
            });

        }


        // User not found

        if (results.length === 0) {

            return res.status(401).json({
                message: "Invalid email or password"
            });

        }


        const user = results[0];


        // Compare password

        const passwordMatch = bcrypt.compareSync(
            password,
            user.password
        );


        // Wrong password

        if (!passwordMatch) {

            return res.status(401).json({
                message: "Invalid email or password"
            });

        }


        // Create JWT token
        // Name is included so profile can display it

        const token = jwt.sign(

            {
                id: user.id,
                name: user.name,
                email: user.email
            },

            JWT_SECRET,

            {
                expiresIn: "1h"
            }

        );


        // Successful login

        res.json({

            message: "Login successful",

            token: token,

            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }

        });

    });

});


// JWT Authentication Middleware

function authenticateToken(req, res, next) {

    const authHeader = req.headers["authorization"];

    const token =
        authHeader && authHeader.split(" ")[1];


    if (!token) {

        return res.status(401).json({
            message: "Access denied. Token required."
        });

    }


    jwt.verify(token, JWT_SECRET, (err, user) => {

        if (err) {

            return res.status(403).json({
                message: "Invalid or expired token."
            });

        }


        req.user = user;

        next();

    });

}


// Protected Profile Route

app.get("/profile", authenticateToken, (req, res) => {

    res.json({

        message: "You accessed a protected route!",

        user: req.user

    });

});


// Start Server

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
});