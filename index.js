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
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
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

    const hashedPassword = bcrypt.hashSync(password, 10);

    const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

    db.query(sql, [name, email, hashedPassword], (err, result) => {

        if (err) {
            console.log("Insert failed:", err.message);
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

    });

});


// Login User

app.post("/login", (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    const sql = "SELECT id, name, email, password FROM users WHERE email = ?";

    db.query(sql, [email], (err, results) => {

        if (err) {
            return res.status(500).json({
                message: "Login failed"
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = results[0];

        const passwordMatch = bcrypt.compareSync(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                name: user.name,
                email: user.email
            },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

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
    const token = authHeader && authHeader.split(" ")[1];

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


// ==================
// TASKS API
// ==================

// GET all tasks - only logged in user's tasks
app.get("/api/tasks", authenticateToken, (req, res) => {

    const userId = req.user.id;
    const sql = "SELECT * FROM tasks WHERE user_id = ?";

    db.query(sql, [userId], (err, results) => {
        if (err) {
            return res.status(500).json({
                error: "Failed to fetch tasks"
            });
        }
        res.json(results);
    });

});


// POST - Create new task
app.post("/api/tasks", authenticateToken, (req, res) => {

    const userId = req.user.id;
    const { title } = req.body;

    if (!title || title.trim() === "") {
        return res.status(400).json({
            error: "Title is required"
        });
    }

    const sql = "INSERT INTO tasks (title, user_id) VALUES (?, ?)";

    db.query(sql, [title, userId], (err, result) => {
        if (err) {
            return res.status(500).json({
                error: "Failed to create task"
            });
        }

        res.status(201).json({
            id: result.insertId,
            title: title,
            is_done: false,
            created_at: new Date()
        });
    });

});


// PATCH - Update is_done
app.patch("/api/tasks/:id", authenticateToken, (req, res) => {

    const userId = req.user.id;
    const { id } = req.params;
    const { is_done } = req.body;

    const sql = "UPDATE tasks SET is_done = ? WHERE id = ? AND user_id = ?";

    db.query(sql, [is_done, id, userId], (err, result) => {
        if (err) {
            return res.status(500).json({
                error: "Failed to update task"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: "Task not found"
            });
        }

        res.json({
            message: "Task updated successfully"
        });
    });

});


// DELETE - Delete a task
app.delete("/api/tasks/:id", authenticateToken, (req, res) => {

    const userId = req.user.id;
    const { id } = req.params;

    const sql = "DELETE FROM tasks WHERE id = ? AND user_id = ?";

    db.query(sql, [id, userId], (err, result) => {
        if (err) {
            return res.status(500).json({
                error: "Failed to delete task"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: "Task not found"
            });
        }

        res.status(204).send();
    });

});


// Start Server

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
});