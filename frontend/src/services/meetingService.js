import api from "./api";

const meetingService = {
  // POST /api/meetings — Create a new meeting (with transcript)
  createMeeting: async (data) => {
    const response = await api.post("/meetings", data);
    return response.data;
  },

  // GET /api/meetings/:id — Get a single meeting
  getMeeting: async (id) => {
    const response = await api.get(`/meetings/${id}`);
    return response.data;
  },

  // POST /api/meetings/:id/process — Trigger AI analysis on meeting transcript
  processMeeting: async (id) => {
    const response = await api.post(`/meetings/${id}/process`);
    return response.data;
  },

  // GET /api/meetings/:id/analysis — Get AI analysis for a meeting
  getMeetingAnalysis: async (id) => {
    const response = await api.get(`/meetings/${id}/analysis`);
    return response.data;
  },

  // GET /api/events/:eventId/meetings — Get all meetings for an event
  getEventMeetings: async (eventId) => {
    const response = await api.get(`/events/${eventId}/meetings`);
    return response.data;
  },
};

export default meetingService;
