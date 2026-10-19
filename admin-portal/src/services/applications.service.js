import api from "./api";

export async function getApplications({
  page = 1,
  limit = 100,
  search = "",
  status = "ACTIVE",
} = {}) {
  const response = await api.get("/applications", {
    params: {
      page,
      limit,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(status ? { status } : {}),
    },
  });

  return response.data;
}

export async function getApplicationById(id) {
  const response = await api.get(`/applications/${encodeURIComponent(id)}`);

  return response.data.data;
}
