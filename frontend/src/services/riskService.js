import api from "./api";

const riskService = {
  createRisk: async (data) => {
    const response = await api.post("/risks", data);
    return response.data;
  },

  getEventRisks: async (eventId) => {
    const response = await api.get(`/events/${eventId}/risks`);
    return response.data;
  },

  getRisk: async (id) => {
    const response = await api.get(`/risks/${id}`);
    return response.data;
  },

  updateRisk: async (id, data) => {
    const response = await api.patch(`/risks/${id}`, data);
    return response.data;
  },

  deleteRisk: async (id) => {
    const response = await api.delete(`/risks/${id}`);
    return response.data;
  },
};

export default riskService;
