const express = require("express");
const router = express.Router();
const pool = require("../db");
const authenticateToken = require("../middleware/auth");


// GET all tasks - only logged in user's tasks
router.get("/", authenticateToken, async (req, res) => {

    const userId = req.user.id;

    try {
        const [results] = await pool.query(
            "SELECT * FROM tasks WHERE user_id = ?",
            [userId]
        );
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch tasks" });
    }

});


// POST - Create new task
router.post("/", authenticateToken, async (req, res) => {

    const userId = req.user.id;
    const { title } = req.body;

    if (!title || title.trim() === "") {
        return res.status(400).json({ error: "Title is required" });
    }

    try {
        const [result] = await pool.query(
            "INSERT INTO tasks (title, user_id) VALUES (?, ?)",
            [title, userId]
        );

        res.status(201).json({
            id: result.insertId,
            title: title,
            is_done: false,
            created_at: new Date()
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to create task" });
    }

});


// PATCH - Update is_done
router.patch("/:id", authenticateToken, async (req, res) => {

    const userId = req.user.id;
    const { id } = req.params;
    const { is_done } = req.body;

    try {
        const [result] = await pool.query(
            "UPDATE tasks SET is_done = ? WHERE id = ? AND user_id = ?",
            [is_done, id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Task not found" });
        }

        res.json({ message: "Task updated successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to update task" });
    }

});


// DELETE - Delete a task
router.delete("/:id", authenticateToken, async (req, res) => {

    const userId = req.user.id;
    const { id } = req.params;

    try {
        const [result] = await pool.query(
            "DELETE FROM tasks WHERE id = ? AND user_id = ?",
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Task not found" });
        }

        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: "Failed to delete task" });
    }

});


module.exports = router;