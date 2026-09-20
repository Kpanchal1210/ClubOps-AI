const mongoose = require("mongoose");

const documentChunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true
    },
    clubId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true
    },
    eventId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true
    },
    fileName: {
      type: String,
      default: "document.pdf"
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
      default: []
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

module.exports = mongoose.model("DocumentChunk", documentChunkSchema);