const express = require("express");

const {
    ragQuery
} = require("../controllers/ragController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();


// POST /api/rag/query
router.post("/query", protect, ragQuery);


module.exports = router;