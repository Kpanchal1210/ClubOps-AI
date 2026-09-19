const mongoose = require("mongoose");

const documentChunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: String,
      required: true,
      index: true
    },

    clubId: {
      type: String,
      required: true,
      index: true
    },

    eventId: {
      type: String,
      default: null,
      index: true
    },

    fileName: {
      type: String,
      required: true
    },

    chunkIndex: {
      type: Number,
      required: true
    },

    text: {
      type: String,
      required: true
    },

    embedding: {
      type: [Number],
      required: true
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

const DocumentChunk = mongoose.model(
  "DocumentChunk",
  documentChunkSchema
);

module.exports = DocumentChunk;