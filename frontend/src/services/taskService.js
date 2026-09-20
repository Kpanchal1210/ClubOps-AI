import api from "./api";

const taskService = {
  createTask: async (data) => {
    const response = await api.post("/tasks", data);
    return response.data;
  },

  getEventTasks: async (eventId) => {
    const response = await api.get(`/events/${eventId}/tasks`);
    return response.data;
  },

  getTask: async (id) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  updateTask: async (id, data) => {
    const response = await api.patch(`/tasks/${id}`, data);
    return response.data;
  },

  deleteTask: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  getUserTasks: async (userId) => {
    const response = await api.get(`/users/${userId}/tasks`);
    return response.data;
  },
};

export default taskService;
