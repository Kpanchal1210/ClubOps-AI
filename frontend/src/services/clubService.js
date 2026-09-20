import api from "./api";

const clubService = {
  // GET /api/clubs/my-club — Retrieve logged-in user's club
  getMyClub: async () => {
    const response = await api.get("/clubs/my-club");
    return response.data;
  },

  // POST /api/clubs — Create club organization
  createClub: async (data) => {
    const response = await api.post("/clubs", data);
    return response.data;
  },

  // GET /api/clubs/:id — Retrieve club details
  getClub: async (id) => {
    const response = await api.get(`/clubs/${id}`);
    return response.data;
  },

  // PATCH /api/clubs/:id — Update club details
  updateClub: async (id, data) => {
    const response = await api.patch(`/clubs/${id}`, data);
    return response.data;
  },

  // GET /api/clubs/:id/members — Retrieve member roster for a club
  getClubMembers: async (id) => {
    const response = await api.get(`/clubs/${id}/members`);
    return response.data;
  },
};

export default clubService;
