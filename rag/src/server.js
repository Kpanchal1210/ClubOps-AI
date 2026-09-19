const express = require("express");
const multer = require("multer");
const { extractTextFromPDF } = require("./loaders/documentLoader");

require("dotenv").config();

const app = express();

app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage()
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ClubOps RAG Service is running"
  });
});

app.post("/api/rag/upload", upload.single("document"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No document uploaded"
      });
    }

    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({
        success: false,
        message: "Only PDF files are supported"
      });
    }

    const result = await extractTextFromPDF(req.file.buffer);

    res.json({
      success: true,
      fileName: req.file.originalname,
      pages: result.pages,
      textLength: result.text.length,
      text: result.text
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`RAG server running on http://localhost:${PORT}`);
});