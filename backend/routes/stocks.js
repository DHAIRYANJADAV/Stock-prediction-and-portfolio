const express = require('express');
const axios = require('axios');
const { authenticateJWT } = require('../middleware');
const router = express.Router();


router.get("/top-gainers", authenticateJWT, async (req, res) => {
    try {
        const response = await axios.get(
            `https://financialmodelingprep.com/api/v3/stock_market/gainers?apikey=${process.env.STOCK_API_KEY}`
        );
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching top gainers:", error.message);
        res.status(500).json({ error: "Failed to fetch top gainers" });
    }
});

// Example endpoint to get top losers
router.get("/top-losers", authenticateJWT, async (req, res) => {
    try {
        const response = await axios.get(
            `https://financialmodelingprep.com/api/v3/stock_market/losers?apikey=${process.env.STOCK_API_KEY}`
        );
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching top losers:", error.message);
        res.status(500).json({ error: "Failed to fetch top losers" });
    }
});

// Get Most Active Stocks
router.get("/actives", authenticateJWT,async (req, res) => {
    try {
        const response = await axios.get(`https://financialmodelingprep.com/api/v3/stock_market/actives?apikey=${process.env.STOCK_API_KEY}`);
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching most active stocks:", error.message);
        res.status(500).json({ error: "Failed to fetch most active stocks", details: error.message });
    }
});


// Example endpoint for large-cap stocks (you can filter more if needed)
router.get("/large-cap", authenticateJWT, async (req, res) => {
    try {
        const response = await axios.get(
            `https://financialmodelingprep.com/api/v3/stock-screener?marketCapMoreThan=10000000000&apikey=${process.env.STOCK_API_KEY}`
        );
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching large cap:", error.message);
        res.status(500).json({ error: "Failed to fetch large cap stocks" });
    }
});

router.get("/mid-cap",authenticateJWT, async (req, res) => {

    try {
        const response = await axios.get(`https://financialmodelingprep.com/api/v3/stock-screener?marketCapMoreThan=2000000000&marketCapLowerThan=10000000000&limit=10&apikey=${process.env.STOCK_API_KEY}`);
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching mid cap stocks:", error.message);
        res.status(500).json({ error: "Failed to fetch mid cap stocks" });
    }
});

router.get("/small-cap",authenticateJWT, async (req, res) => {
    
    try {
        const response = await axios.get(`https://financialmodelingprep.com/api/v3/stock-screener?marketCapMoreThan=300000000&marketCapLowerThan=2000000000&limit=10&apikey=${process.env.STOCK_API_KEY}`);
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching small cap stocks:", error.message);
        res.status(500).json({ error: "Failed to fetch small cap stocks" });
    }
});



module.exports = router;
