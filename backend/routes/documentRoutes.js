const express = require("express");

const {
    createDocument,
    getDocumentById,
    getClubDocuments,
    getEventDocuments,
    processDocument,
    deleteDocument
} = require("../controllers/documentController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createDocument);

router.get("/club/:clubId", protect, getClubDocuments);

router.get("/event/:eventId", protect, getEventDocuments);

router.get("/:id", protect, getDocumentById);

router.post("/:id/process", protect, processDocument);

router.delete("/:id", protect, deleteDocument);

module.exports = router;