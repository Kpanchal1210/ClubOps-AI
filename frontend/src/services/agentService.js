import api from "./api";

const agentService = {
  // POST /api/agent/command — send a natural language command
  // Body: { command, eventId }
  // Returns: { intent, tool, parameters, status, result }
  sendCommand: async (command, eventId) => {
    const response = await api.post("/agent/command", { command, eventId });
    return response.data;
  },

  // GET /api/agent/actions — full audit trail for the event
  getActions: async (eventId) => {
    const response = await api.get("/agent/actions", {
      params: eventId ? { eventId } : undefined,
    });
    return response.data;
  },

  // GET /api/agent/actions/:id — single action detail
  getAction: async (id) => {
    const response = await api.get(`/agent/actions/${id}`);
    return response.data;
  },
};

export default agentService;
