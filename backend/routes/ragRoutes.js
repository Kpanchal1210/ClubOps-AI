const express = require("express");
const multer = require("multer");
const {
  ragQuery,
  ragUpload
} = require("../controllers/ragController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB
  }
});

// POST /api/rag/upload — In-process PDF extraction, chunking, embedding, and storage
router.post("/upload", protect, upload.single("document"), ragUpload);

// POST /api/rag/query — Ask questions grounded in uploaded event/club documents
router.post("/query", protect, ragQuery);

// POST /api/rag/ask — Alias for /query for compatibility
router.post("/ask", protect, ragQuery);

module.exports = router;