const express = require("express");
const axios = require("axios");
const { authenticateJWT } = require("./middleware");
const db = require("./db");
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


router.get("/", (req, res) => {
    res.json({ message: "Backend is running!" });
});

router.post("/users",
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;

        try {
            //Hash the password before storing
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert into database
            const result = await db.query(
                "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *",
                [name, email, hashedPassword]
            );

            // Do not return password in response for security
            const user = {
                id: result.rows[0].id,
                name: result.rows[0].name,
                email: result.rows[0].email,
                created_at: result.rows[0].created_at
            };

            res.status(201).json(user);
        } catch (error) {
            console.error("Error inserting user:", error.message);
            res.status(500).json({ error: "Failed to insert user", details: error.message });
        }
    }
);

// Login route
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user by email
        const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ error: "User not found" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid password" });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email }, // Payload
            process.env.JWT_SECRET, // Secret key
            { expiresIn: "1h" } // Token expiry time
        );

        // Success response with token
        res.status(200).json({
            message: "Login successful",
            token: token,
            user: { id: user.id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error("Login error:", error.message);
        res.status(500).json({ error: "Login failed", details: error.message });
    }
});

// Protected route 
router.get("/profile", authenticateJWT, async (req, res) => {
    try {
        // Access user data from token
        const userId = req.user.id;

        // Fetch user data (excluding password)
        const result = await db.query(
            "SELECT id, name, email, created_at FROM users WHERE id = $1",
            [userId]
        );

        const user = result.rows[0];
        res.json({ message: "Profile data fetched successfully", user });
    } catch (error) {
        console.error("Error fetching profile:", error.message);
        res.status(500).json({ error: "Failed to fetch profile", details: error.message });
    }
});

// get all user admin
router.get("/users", authenticateJWT, async (req, res) => {
    try {
        const result = await db.query("SELECT id, name, email, created_at FROM users");
        res.json({ message: "All users fetched successfully", users: result.rows });
    } catch (error) {
        console.error("Error fetching users:", error.message);
        res.status(500).json({ error: "Failed to fetch users", details: error.message });
    }
});

// Get user by ID
router.get("/users/:id", authenticateJWT, async (req, res) => {
    const userId = req.params.id;
    try {
        const result = await db.query(
            "SELECT id, name, email, created_at FROM users WHERE id = $1",
            [userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json({ message: "User fetched successfully", user: result.rows[0] });
    } catch (error) {
        console.error("Error fetching user:", error.message);
        res.status(500).json({ error: "Failed to fetch user", details: error.message });
    }
});

// Update user by ID
router.put("/users/:id", authenticateJWT, async (req, res) => {
    const userId = req.params.id;
    const { name, email, password } = req.body;

    try {
        const result = await db.query(
            "UPDATE users SET name = $1, email = $2, password = $3 WHERE id = $4 RETURNING id, name, email, created_at",
            [name, email, password, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "User updated successfully", user: result.rows[0] });
    } catch (error) {
        console.error("Error updating user:", error.message);
        res.status(500).json({ error: "Failed to update user", details: error.message });
    }
});

// Delete user by ID
router.delete("/users/:id", authenticateJWT, async (req, res) => {
    const userId = req.params.id;
    try {
        const result = await db.query("DELETE FROM users WHERE id = $1 RETURNING *", [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "User deleted successfully", user: result.rows[0] });
    } catch (error) {
        console.error("Error deleting user:", error.message);
        res.status(500).json({ error: "Failed to delete user", details: error.message });
    }
});

module.exports = router;
