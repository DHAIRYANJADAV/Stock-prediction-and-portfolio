const express = require("express");
const db = require("../db"); // Your database connection
const { authenticateJWT } = require("../middleware"); // JWT middleware to protect routes

const router = express.Router();

// Add stock to user's portfolio
router.post("/", authenticateJWT, async (req, res) => {
    const { stock_symbol } = req.body;
    const userId = req.user.id;

    try {
        const result = await db.query(
            "INSERT INTO portfolio (user_id, stock_symbol) VALUES ($1, $2) RETURNING *",
            [userId, stock_symbol]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error adding stock to portfolio:", error.message);
        res.status(500).json({ error: "Failed to add stock", details: error.message });
    }
});

//  Get user's portfolio
router.get("/", authenticateJWT, async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await db.query(
            "SELECT stock_symbol FROM portfolio WHERE user_id = $1",
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching portfolio:", error.message);
        res.status(500).json({ error: "Failed to fetch portfolio", details: error.message });
    }
});

//  Remove stock from user's portfolio
router.delete("/", authenticateJWT, async (req, res) => {
    const { stock_symbol } = req.body;
    const userId = req.user.id;

    try {
        const result = await db.query(
            "DELETE FROM portfolio WHERE user_id = $1 AND stock_symbol = $2 RETURNING *",
            [userId, stock_symbol]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Stock not found in portfolio" });
        }
        res.json({ message: "Stock removed from portfolio" });
    } catch (error) {
        console.error("Error removing stock:", error.message);
        res.status(500).json({ error: "Failed to remove stock", details: error.message });
    }
});


// Get user's portfolio with live prices
router.get("/live", authenticateJWT, async (req, res) => {
    const userId = req.user.id;

    try {
        // 1. Get user's portfolio stocks
        const result = await db.query(
            "SELECT stock_symbol FROM portfolio WHERE user_id = $1",
            [userId]
        );

        const stocks = result.rows.map(row => row.stock_symbol);

        if (stocks.length === 0) {
            return res.json({ message: "No stocks in portfolio" });
        }

        // 2. Fetch live prices from FMP API
        const stockList = stocks.join(',');
        const response = await fetch(`https://financialmodelingprep.com/api/v3/quote/${stockList}?apikey=${process.env.STOCK_API_KEY}`);
        const data = await response.json();

        // 3. Return stock data
        res.json(data);

    } catch (error) {
        console.error("Error fetching portfolio with live prices:", error.message);
        res.status(500).json({ error: "Failed to fetch portfolio live prices", details: error.message });
    }
});


module.exports = router;
