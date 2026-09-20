import api from "./api";

const eventService = {
  createEvent: async (data) => {
    const response = await api.post("/events", data);
    return response.data;
  },

  generateAIEventPlan: async (data) => {
    const response = await api.post("/events/ai-plan", data);
    return response.data;
  },

  getEvent: async (id) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  updateEvent: async (id, data) => {
    const response = await api.patch(`/events/${id}`, data);
    return response.data;
  },

  deleteEvent: async (id) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },

  getDashboard: async (id) => {
    const response = await api.get(`/events/${id}/dashboard`);
    return response.data;
  },

  getAllEvents: async () => {
    const response = await api.get("/events");
    return response.data;
  },
};


export default eventService;
