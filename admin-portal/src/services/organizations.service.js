import api from "./api";

export async function getActiveOrganizations() {
  const organizations = [];
  let page = 1;
  let pages = 1;

  do {
    const response = await api.get("/organizations", {
      params: {
        status: "ACTIVE",
        page,
        limit: 100,
      },
    });

    organizations.push(...(response.data.data || []));
    pages = response.data.pagination?.pages || 1;
    page += 1;
  } while (page <= pages);

  return organizations;
}
