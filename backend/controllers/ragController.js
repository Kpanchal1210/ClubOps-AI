const axios = require("axios");

const Club = require("../models/Club");

// --------------------------------------------------
// POST /api/rag/query
// Backend → RAG Service
// --------------------------------------------------

const ragQuery = async (req, res) => {
    try {
        const {
            query,
            clubId,
            eventId,
            documentId
        } = req.body;

        // --------------------------------------------------
        // Validate query
        // --------------------------------------------------

        if (!query || !query.trim()) {
            return res.status(400).json({
                success: false,
                message: "Query is required"
            });
        }

        // --------------------------------------------------
        // Validate clubId
        // --------------------------------------------------

        if (!clubId) {
            return res.status(400).json({
                success: false,
                message: "clubId is required"
            });
        }

        // --------------------------------------------------
        // Check club
        // --------------------------------------------------

        const club = await Club.findById(clubId);

        if (!club) {
            return res.status(404).json({
                success: false,
                message: "Club not found"
            });
        }

        // --------------------------------------------------
        // Check membership
        // --------------------------------------------------

        const isMember = club.members.some(
            memberId =>
                memberId.toString() === req.user.userId
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this club"
            });
        }

        // --------------------------------------------------
        // Call RAG Service
        // --------------------------------------------------

        console.log("Sending query to RAG service...");

        const ragResponse = await axios.post(
            `${process.env.RAG_SERVICE_URL}/api/rag/ask`,
            {
                question: query.trim(),
                documentId: documentId || null
            }
        );

        // --------------------------------------------------
        // Return RAG response
        // --------------------------------------------------

        return res.json({
            success: true,
            data: {
                query: query.trim(),
                clubId,
                eventId: eventId || null,
                documentId: documentId || null,
                answer: ragResponse.data.answer,
                sources: ragResponse.data.sources || []
            }
        });

    } catch (error) {
        console.error("RAG query error:", error.message);

        // RAG service error
        if (error.response) {
            return res.status(502).json({
                success: false,
                message: "RAG service failed",
                error: error.response.data?.message || error.message
            });
        }

        // RAG service unavailable
        if (error.code === "ECONNREFUSED") {
            return res.status(503).json({
                success: false,
                message: "RAG service is unavailable"
            });
        }

        return res.status(500).json({
            success: false,
            message: "RAG query failed",
            error: error.message
        });
    }
};

module.exports = {
    ragQuery
};