const Document = require("../models/Document");
const DocumentChunk = require("../models/DocumentChunk");
const Club = require("../models/Club");
const Event = require("../models/Event");
const { chunkText } = require("../rag/chunking/chunker");
const { generateEmbedding } = require("../rag/embeddings/embedder");

const checkClubMember = async (clubId, userId) => {
    const club = await Club.findById(clubId);

    if (!club) {
        return { club: null, allowed: false };
    }

    const allowed = club.members.some(
        id => id.toString() === userId.toString()
    );

    return { club, allowed };
};


// POST /api/documents
const createDocument = async (req, res) => {
    try {
        const {
            clubId,
            eventId,
            title,
            fileName,
            fileType,
            fileUrl,
            content
        } = req.body;

        if (!clubId || !title || !fileName || !fileType) {
            return res.status(400).json({
                success: false,
                message: "clubId, title, fileName and fileType are required"
            });
        }

        const { club, allowed } = await checkClubMember(
            clubId,
            req.user.userId
        );

        if (!club) {
            return res.status(404).json({
                success: false,
                message: "Club not found"
            });
        }

        if (!allowed) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this club"
            });
        }

        if (eventId) {
            const event = await Event.findById(eventId);

            if (!event) {
                return res.status(404).json({
                    success: false,
                    message: "Event not found"
                });
            }

            if (event.clubId.toString() !== clubId.toString()) {
                return res.status(400).json({
                    success: false,
                    message: "Event does not belong to this club"
                });
            }
        }

        const document = await Document.create({
            clubId,
            eventId: eventId || undefined,
            title,
            fileName,
            fileType,
            fileUrl,
            content,
            uploadedBy: req.user.userId
        });

        res.status(201).json({
            success: true,
            message: "Document created successfully",
            data: document
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create document",
            error: error.message
        });
    }
};


// GET /api/documents/:id
const getDocumentById = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id)
            .populate("uploadedBy", "name email")
            .populate("eventId", "name");

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found"
            });
        }

        const { allowed } = await checkClubMember(
            document.clubId,
            req.user.userId
        );

        if (!allowed) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        const chunks = await DocumentChunk.find({
            $or: [
                { documentId: document._id },
                { documentId: document._id.toString() }
            ]
        })
            .sort({ chunkIndex: 1 })
            .select("-embedding");

        res.json({
            success: true,
            data: {
                ...document.toObject(),
                chunks: chunks || []
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get document",
            error: error.message
        });
    }
};


// GET /api/documents/club/:clubId
const getClubDocuments = async (req, res) => {
    try {
        const { clubId } = req.params;

        const { club, allowed } = await checkClubMember(
            clubId,
            req.user.userId
        );

        if (!club) {
            return res.status(404).json({
                success: false,
                message: "Club not found"
            });
        }

        if (!allowed) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        const documents = await Document.find({ clubId })
            .populate("uploadedBy", "name email")
            .populate("eventId", "name")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: documents
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get documents",
            error: error.message
        });
    }
};


// POST /api/documents/:id/process
const processDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found"
            });
        }

        const { allowed } = await checkClubMember(
            document.clubId,
            req.user.userId
        );

        if (!allowed) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        if (!document.content && !document.fileUrl) {
            return res.status(400).json({
                success: false,
                message: "Document has no content or file URL"
            });
        }

        let totalChunks = 0;
        if (document.content) {
            // Remove previous chunks for idempotence
            await DocumentChunk.deleteMany({ documentId: document._id.toString() });

            const chunks = chunkText(document.content, 500, 50);
            for (const chunk of chunks) {
                let embedding = [];
                try {
                    embedding = await generateEmbedding(chunk.text);
                } catch (embErr) {
                    console.warn(`[Process Document] Embedding chunk ${chunk.chunkIndex} failed:`, embErr.message);
                }

                await DocumentChunk.create({
                    documentId: document._id.toString(),
                    clubId: document.clubId ? document.clubId.toString() : null,
                    eventId: document.eventId ? document.eventId.toString() : null,
                    fileName: document.fileName || document.title,
                    chunkIndex: chunk.chunkIndex,
                    text: chunk.text,
                    embedding,
                    metadata: {
                        title: document.title
                    }
                });
            }

            totalChunks = chunks.length;
            document.processed = true;
            await document.save();
        }

        res.json({
            success: true,
            message: "Document processed and indexed successfully",
            data: {
                documentId: document._id,
                processed: true,
                totalChunks
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Document processing failed",
            error: error.message
        });
    }
};


// DELETE /api/documents/:id
const deleteDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found"
            });
        }

        const { allowed } = await checkClubMember(
            document.clubId,
            req.user.userId
        );

        if (!allowed) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        const canDelete =
            req.user.role === "admin" ||
            req.user.role === "organizer" ||
            document.uploadedBy.toString() === req.user.userId;

        if (!canDelete) {
            return res.status(403).json({
                success: false,
                message: "You cannot delete this document"
            });
        }

        await DocumentChunk.deleteMany({
            documentId: document._id
        });

        await Document.findByIdAndDelete(document._id);

        res.json({
            success: true,
            message: "Document deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete document",
            error: error.message
        });
    }
};


// GET /api/documents/event/:eventId
const getEventDocuments = async (req, res) => {
    try {
        const { eventId } = req.params;
        const documents = await Document.find({ eventId })
            .populate("uploadedBy", "name email")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: documents
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get event documents",
            error: error.message
        });
    }
};


module.exports = {
    createDocument,
    getDocumentById,
    getClubDocuments,
    getEventDocuments,
    processDocument,
    deleteDocument
};