import api from "./api";

export const getDashboardStatistics = async () => {
  const response = await api.get("/admin/dashboard");
  return response.data.data;
};
