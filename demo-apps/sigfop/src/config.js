import dotenv from "dotenv";

dotenv.config();

const required = [
  "OIDC_ISSUER",
  "OIDC_CLIENT_ID",
  "OIDC_CLIENT_SECRET",
  "OIDC_REDIRECT_URI",
  "OIDC_POST_LOGOUT_REDIRECT_URI",
  "SESSION_SECRET",
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`${key} doit être configuré`);
  }
}

export const config = {
  port: Number(process.env.PORT || 4001),

  oidc: {
    issuer: process.env.OIDC_ISSUER,
    clientId: process.env.OIDC_CLIENT_ID,
    clientSecret: process.env.OIDC_CLIENT_SECRET,
    redirectUri: process.env.OIDC_REDIRECT_URI,
    postLogoutRedirectUri: process.env.OIDC_POST_LOGOUT_REDIRECT_URI,
  },

  sessionSecret: process.env.SESSION_SECRET,
};
