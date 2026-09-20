import api from "./api";

const notificationService = {
  getNotifications: async () => {
    const response = await api.get(
      "/notifications"
    );

    return response.data;
  },

  markAsRead: async (id) => {
    const response = await api.patch(
      `/notifications/${id}/read`
    );

    return response.data;
  },
};

export default notificationService;