import api from "./api";

const volunteerService = {
  createVolunteer: async (data) => {
    const response = await api.post(
      "/volunteers",
      data
    );

    return response.data;
  },

  getEventVolunteers: async (eventId) => {
    const response = await api.get(
      `/events/${eventId}/volunteers`
    );

    return response.data;
  },

  updateVolunteer: async (id, data) => {
    const response = await api.patch(
      `/volunteers/${id}`,
      data
    );

    return response.data;
  },
};

export default volunteerService;