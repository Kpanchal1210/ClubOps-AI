const Document = require("../models/Document");
const Club = require("../models/Club");


// --------------------------------------------------
// POST /api/rag/query
// --------------------------------------------------

const ragQuery = async (req, res) => {
    try {
        const {
            query,
            clubId,
            eventId
        } = req.body;

        if (!query || !query.trim()) {
            return res.status(400).json({
                success: false,
                message: "Query is required"
            });
        }

        if (!clubId) {
            return res.status(400).json({
                success: false,
                message: "clubId is required"
            });
        }

        const club = await Club.findById(clubId);

        if (!club) {
            return res.status(404).json({
                success: false,
                message: "Club not found"
            });
        }

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
        // IMPORTANT:
        // Actual RAG retrieval + Gemini answer will be
        // implemented by the RAG teammate.
        // --------------------------------------------------

        return res.json({
            success: true,
            message: "RAG query received",
            data: {
                query: query.trim(),
                clubId,
                eventId: eventId || null,
                status: "ready_for_rag_processing"
            }
        });

    } catch (error) {
        console.error("RAG query error:", error);

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