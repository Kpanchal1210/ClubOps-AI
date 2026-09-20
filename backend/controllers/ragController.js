const Club = require("../models/Club");
const Event = require("../models/Event");
const Document = require("../models/Document");
const DocumentChunk = require("../models/DocumentChunk");
const { extractTextFromPDF, extractTextFromFile } = require("../rag/loaders/documentLoader");
const { chunkText } = require("../rag/chunking/chunker");
const { generateEmbedding } = require("../rag/embeddings/embedder");
const { generateRAGAnswer } = require("../rag/services/ragService");

/**
 * Ingest and process an uploaded PDF document.
 * Extracts text, chunks it, generates dense embeddings, and stores in DocumentChunk.
 */
const ragUpload = async (req, res) => {
  try {
    let { clubId, eventId } = req.body;

    // Check if eventId provided without clubId, resolve clubId
    if (!clubId && eventId) {
      const event = await Event.findById(eventId);
      if (event) {
        clubId = event.clubId.toString();
      }
    }

    if (!clubId) {
      return res.status(400).json({
        success: false,
        message: "clubId is required"
      });
    }

    // Check club existence & membership if authenticated
    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found"
      });
    }

    if (req.user && req.user.userId) {
      const isMember = club.members.some(
        (m) => m.toString() === req.user.userId.toString()
      );
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: "You are not a member of this club"
        });
      }
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No document uploaded"
      });
    }

    const ext = (req.file.originalname || "").split(".").pop().toLowerCase();
    const allowedExts = ["pdf", "docx", "doc", "txt", "md"];
    if (!allowedExts.includes(ext) && req.file.mimetype !== "application/pdf") {
      return res.status(400).json({
        success: false,
        message: "Supported file formats: PDF, DOCX, DOC, TXT"
      });
    }

    console.log(`[RAG Upload] Processing: ${req.file.originalname} (${ext}) for Club: ${clubId}`);

    // 1. Extract plain text from document
    const result = await extractTextFromFile(req.file.buffer, req.file.originalname, req.file.mimetype);
    console.log(`[RAG Upload] Extracted ${result.text.length} characters across ${result.pages} pages/sections`);

    // 2. Chunk text
    const chunks = chunkText(result.text, 500, 50);
    console.log(`[RAG Upload] Generated ${chunks.length} chunks`);

    const documentId = `doc-${Date.now()}`;

    // 3. Create a Document record in database for UI visibility
    let createdDoc = null;
    try {
      createdDoc = await Document.create({
        clubId,
        eventId: eventId || undefined,
        title: req.file.originalname.replace(/\.[^/.]+$/, ""),
        fileName: req.file.originalname,
        fileType: ext || "txt",
        content: result.text,
        uploadedBy: req.user?.userId || club.organizers?.[0] || club.members?.[0]
      });
    } catch (docErr) {
      console.warn("[RAG Upload] Could not create Document entity record:", docErr.message);
    }

    const docRefId = createdDoc ? createdDoc._id.toString() : documentId;

    // 4. Generate embeddings and persist chunks
    const savedChunks = [];
    for (const chunk of chunks) {
      let embedding = [];
      try {
        embedding = await generateEmbedding(chunk.text);
      } catch (embErr) {
        console.warn(`[RAG Upload] Failed to embed chunk ${chunk.chunkIndex}:`, embErr.message);
      }

      const savedChunk = await DocumentChunk.create({
        documentId: docRefId,
        clubId,
        eventId: eventId || null,
        fileName: req.file.originalname,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        embedding,
        metadata: {
          pages: result.pages
        }
      });
      savedChunks.push(savedChunk);
    }

    console.log(`[RAG Upload] Stored ${savedChunks.length} chunks for ${req.file.originalname}`);

    return res.json({
      success: true,
      message: "Document processed successfully",
      documentId: docRefId,
      clubId,
      eventId: eventId || null,
      fileName: req.file.originalname,
      pages: result.pages,
      totalChunks: savedChunks.length
    });
  } catch (error) {
    console.error("[RAG Upload] Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process uploaded document"
    });
  }
};

/**
 * Query documents grounded in RAG knowledge base.
 * Accepts { query | question, clubId, eventId, documentId }.
 */
const ragQuery = async (req, res) => {
  try {
    const rawQuery = req.body.query || req.body.question;
    let { clubId, eventId, documentId } = req.body;

    if (!rawQuery || !rawQuery.trim()) {
      return res.status(400).json({
        success: false,
        message: "Query / Question is required"
      });
    }

    // Resolve clubId from event if not directly supplied
    if (!clubId && eventId) {
      const event = await Event.findById(eventId);
      if (event) {
        clubId = event.clubId.toString();
      }
    }

    if (!clubId) {
      return res.status(400).json({
        success: false,
        message: "clubId is required (or valid eventId)"
      });
    }

    // Check club existence & membership if authenticated
    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found"
      });
    }

    if (req.user && req.user.userId) {
      const isMember = club.members.some(
        (m) => m.toString() === req.user.userId.toString()
      );
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: "You are not a member of this club"
        });
      }
    }

    const trimmedQuery = rawQuery.trim();
    console.log(`[RAG Query] Processing in-process query: "${trimmedQuery}" for Club: ${clubId}`);

    // Call in-process RAG answer generation directly
    const result = await generateRAGAnswer(
      trimmedQuery,
      documentId || null,
      clubId,
      eventId || null
    );

    const sourceFiles = [
      ...new Set((result.sources || []).map((s) => s.fileName || s.title || "Document").filter(Boolean))
    ];

    return res.json({
      success: true,
      question: trimmedQuery,
      query: trimmedQuery,
      documentId: documentId || null,
      clubId,
      eventId: eventId || null,
      answer: result.answer,
      sources: result.sources || [],
      sourceFiles,
      data: {
        query: trimmedQuery,
        clubId,
        eventId: eventId || null,
        documentId: documentId || null,
        answer: result.answer,
        sources: result.sources || [],
        sourceFiles
      }
    });
  } catch (error) {
    console.error("[RAG Query] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "RAG query failed",
      error: error.message
    });
  }
};

module.exports = {
  ragUpload,
  ragQuery
};