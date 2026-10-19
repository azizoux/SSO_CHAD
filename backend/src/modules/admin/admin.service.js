import User from "../users/user.model.js";
import Organization from "../organizations/organization.model.js";
import Application from "../applications/application.model.js";
import Session from "../sessions/session.model.js";
import UserApplicationAccess from "../access/userApplicationAccess.model.js";

export const getDashboardStatistics = async () => {
  const now = new Date();

  const [
    totalUsers,
    activeUsers,
    totalOrganizations,
    totalApplications,
    activeApplications,
    activeSessions,
    activeAccess,
    suspendedAccess,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: "ACTIVE" }),

    Organization.countDocuments(),

    Application.countDocuments(),
    Application.countDocuments({ status: "ACTIVE" }),

    Session.countDocuments({
      status: "ACTIVE",
      expiresAt: { $gt: now },
    }),

    UserApplicationAccess.countDocuments({
      status: "ACTIVE",
    }),

    UserApplicationAccess.countDocuments({
      status: "SUSPENDED",
    }),
  ]);

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
    },
    organizations: {
      total: totalOrganizations,
    },
    applications: {
      total: totalApplications,
      active: activeApplications,
    },
    sessions: {
      active: activeSessions,
    },
    access: {
      active: activeAccess,
      suspended: suspendedAccess,
    },
  };
};
