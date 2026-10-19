import api from "./api";

/**
 * Liste toutes les habilitations d'un utilisateur.
 * GET /api/v1/access/users/:userId
 */
export async function getUserAccesses(userId) {
  const response = await api.get(`/access/users/${encodeURIComponent(userId)}`);

  return response.data;
}

/**
 * Consulte une habilitation précise.
 */
export async function getUserApplicationAccess(userId, applicationId) {
  const response = await api.get(
    `/access/users/${encodeURIComponent(userId)}` +
      `/applications/${encodeURIComponent(applicationId)}`,
  );

  return response.data;
}

/**
 * Attribue une habilitation applicative.
 */
export async function grantUserAccess(payload) {
  const response = await api.post("/access", payload);

  return response.data;
}

/**
 * Modifie les rôles, scopes ou paramètres.
 */
export async function updateUserAccess(userId, applicationId, payload) {
  const response = await api.patch(
    `/access/users/${encodeURIComponent(userId)}` +
      `/applications/${encodeURIComponent(applicationId)}`,
    payload,
  );

  return response.data;
}

/**
 * Suspend une habilitation.
 */
export async function suspendUserAccess(userId, applicationId) {
  const response = await api.post(
    `/access/users/${encodeURIComponent(userId)}` +
      `/applications/${encodeURIComponent(applicationId)}/suspend`,
  );

  return response.data;
}

/**
 * Réactive une habilitation suspendue.
 */
export async function reactivateUserAccess(userId, applicationId) {
  const response = await api.post(
    `/access/users/${encodeURIComponent(userId)}` +
      `/applications/${encodeURIComponent(applicationId)}/reactivate`,
  );

  return response.data;
}

/**
 * Révoque définitivement une habilitation.
 */
export async function revokeUserAccess(userId, applicationId, reason) {
  const response = await api.post(
    `/access/users/${encodeURIComponent(userId)}` +
      `/applications/${encodeURIComponent(applicationId)}/revoke`,
    { reason },
  );

  return response.data;
}
