import api from "./api";

const documentService = {
  // POST /api/documents — Upload an event document for RAG ingestion
  uploadDocument: async (data) => {
    const isFormData = data instanceof FormData;
    const response = await api.post("/documents", data, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
    });
    return response.data;
  },

  // GET /api/documents/:id — Retrieve document metadata and processing status
  getDocument: async (id) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  // POST /api/documents/:id/process — Trigger chunking and embedding pipeline
  processDocument: async (id) => {
    const response = await api.post(`/documents/${id}/process`);
    return response.data;
  },

  // GET /api/events/:eventId/documents — Get all documents for an event
  getEventDocuments: async (eventId) => {
    const response = await api.get(`/events/${eventId}/documents`);
    return response.data;
  },

  // POST /api/rag/query — Ask questions grounded in uploaded event documents
  // Body: { query, eventId }
  // Response: { answer: string, sources: string[] }
  queryRAG: async ({ query, eventId }) => {
    const response = await api.post("/rag/query", { query, eventId });
    return response.data;
  },
};

export default documentService;
