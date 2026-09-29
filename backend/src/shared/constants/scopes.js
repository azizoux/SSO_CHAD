export const OIDC_SCOPES = Object.freeze({
  OPENID: "openid",
  PROFILE: "profile",
  EMAIL: "email",
  OFFLINE_ACCESS: "offline_access",
});

export const DEFAULT_SCOPES = Object.freeze([
  OIDC_SCOPES.OPENID,
  OIDC_SCOPES.PROFILE,
]);
