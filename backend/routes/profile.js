const express = require("express");
const db = require("../db");
const { authenticateJWT } = require("../middleware");
const bcrypt = require("bcrypt");

const router = express.Router();

//  Update user profile
router.put("/update", authenticateJWT, async (req, res) => {
    const userId = req.user.id;
    const { name, email } = req.body;

    if (!name && !email) {
        return res.status(400).json({ error: "Name or email must be provided" });
    }

    try {
        const fields = [];
        const values = [];
        let queryIdx = 1;

        if (name) {
            fields.push(`name = $${queryIdx++}`);
            values.push(name);
        }
        if (email) {
            fields.push(`email = $${queryIdx++}`);
            values.push(email);
        }

        values.push(userId); // Last value is userId

        const result = await db.query(
            `UPDATE users SET ${fields.join(", ")} WHERE id = $${queryIdx} RETURNING id, name, email, created_at`,
            values
        );

        res.json({ message: "Profile updated successfully", user: result.rows[0] });
    } catch (error) {
        console.error("Error updating profile:", error.message);
        res.status(500).json({ error: "Failed to update profile", details: error.message });
    }
});



//  Change user password
router.put("/change-password", authenticateJWT, async (req, res) => {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: "Old and new passwords are required" });
    }

    try {
        // Fetch current hashed password from DB
        const result = await db.query("SELECT password FROM users WHERE id = $1", [userId]);
        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Compare old password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Old password is incorrect" });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await db.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, userId]);

        res.json({ message: "Password changed successfully" });
    } catch (error) {
        console.error("Error changing password:", error.message);
        res.status(500).json({ error: "Failed to change password", details: error.message });
    }
});

module.exports = router;
