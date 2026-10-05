import Application from "../applications/application.model.js";
import * as tokenService from "../oauth/token.service.js";

const BACKCHANNEL_TIMEOUT_MS = 3000;

const postLogoutToken = async ({ uri, logoutToken }) => {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, BACKCHANNEL_TIMEOUT_MS);

  try {
    const body = new URLSearchParams();

    body.set("logout_token", logoutToken);

    const response = await fetch(uri, {
      method: "POST",

      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },

      body: body.toString(),

      signal: controller.signal,
    });

    return {
      success: response.ok,
      status: response.status,
    };
  } finally {
    clearTimeout(timeout);
  }
};

export const notifyBackchannelParticipants = async ({ session }) => {
  const participants = session?.participants || [];

  if (participants.length === 0) {
    return [];
  }

  const applicationIds = participants.map(
    (participant) => participant.application,
  );

  const applications = await Application.find({
    _id: { $in: applicationIds },
    status: "ACTIVE",
    backchannelLogoutUri: { $ne: null },
  });

  const applicationMap = new Map(
    applications.map((application) => [
      application._id.toString(),
      application,
    ]),
  );

  const tasks = participants.map(async (participant) => {
    const application = applicationMap.get(participant.application.toString());

    if (!application?.backchannelLogoutUri) {
      return {
        clientId: participant.clientId,
        success: false,
        skipped: true,
        reason: "BACKCHANNEL_LOGOUT_URI_NOT_CONFIGURED",
      };
    }

    try {
      const logoutToken = tokenService.createLogoutToken({
        session,
        application,
        user: session.user,
      });

      const result = await postLogoutToken({
        uri: application.backchannelLogoutUri,
        logoutToken,
      });

      return {
        clientId: application.clientId,
        uri: application.backchannelLogoutUri,
        ...result,
      };
    } catch (error) {
      return {
        clientId: application.clientId,
        uri: application.backchannelLogoutUri,
        success: false,
        error: error.message,
      };
    }
  });

  return Promise.all(tasks);
};
