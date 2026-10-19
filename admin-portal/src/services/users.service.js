import api from "./api";

export async function getUsers({
  page = 1,
  limit = 20,
  search = "",
  status = "",
  role = "",
} = {}) {
  const response = await api.get("/users", {
    params: {
      page,
      limit,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(status ? { status } : {}),
      ...(role ? { role } : {}),
    },
  });

  return response.data;
}

export async function getUserById(id) {
  const response = await api.get(`/users/${encodeURIComponent(id)}`);

  return response.data.data;
}
export async function createUser(payload) {
  const response = await api.post("/admin/users", payload);
  return response.data;
}
export async function updateUserProfile(id, payload) {
  const response = await api.patch(
    `/admin/users/${encodeURIComponent(id)}/profile`,
    payload,
  );

  return response.data;
}
export async function suspendUser(id) {
  const response = await api.patch(
    `/admin/users/${encodeURIComponent(id)}/suspend`,
  );

  return response.data;
}

export async function activateUser(id) {
  const response = await api.patch(
    `/admin/users/${encodeURIComponent(id)}/activate`,
  );

  return response.data;
}
