import api from "./api";

const authService = {
  register: async (data) => {
    const response = await api.post("/users/register", data);
    return response.data;
  },

  login: async (data) => {
    const response = await api.post("/users/login", data);
    return response.data;
  },

  getUser: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  updateUser: async (id, data) => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },
};

export default authService;
