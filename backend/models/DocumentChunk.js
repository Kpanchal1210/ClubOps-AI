const mongoose = require("mongoose");

const documentChunkSchema = new mongoose.Schema(
    {
        documentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Document",
            required: true
        },

        text: {
            type: String,
            required: true
        },

        chunkIndex: {
            type: Number,
            required: true
        },

        embedding: {
            type: [Number],
            default: []
        },

        metadata: {
            page: {
                type: Number
            },

            section: {
                type: String
            }
        }
    },
    {
        timestamps: true
    }
);

documentChunkSchema.index({ documentId: 1 });

module.exports = mongoose.model(
    "DocumentChunk",
    documentChunkSchema
);