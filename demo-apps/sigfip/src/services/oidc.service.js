import crypto from "crypto";

import { config } from "../config.js";

import { createRemoteJWKSet, jwtVerify } from "jose";

const BACKCHANNEL_LOGOUT_EVENT =
  "http://schemas.openid.net/event/backchannel-logout";

const jwks = createRemoteJWKSet(
  new URL(`${config.oidc.issuer}/.well-known/jwks.json`),
);

const base64UrlEncode = (buffer) => {
  return buffer.toString("base64url");
};

export const generateRandomValue = (bytes = 32) => {
  return base64UrlEncode(crypto.randomBytes(bytes));
};

export const generatePkce = () => {
  const codeVerifier = generateRandomValue(48);

  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  return {
    codeVerifier,
    codeChallenge,
  };
};

export const buildAuthorizationUrl = ({ state, nonce, codeChallenge }) => {
  const url = new URL(`${config.oidc.issuer}/api/v1/oauth/authorize`);

  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.oidc.clientId);
  url.searchParams.set("redirect_uri", config.oidc.redirectUri);

  url.searchParams.set("scope", "openid profile email");

  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);

  url.searchParams.set("code_challenge", codeChallenge);

  url.searchParams.set("code_challenge_method", "S256");

  return url.toString();
};

export const exchangeAuthorizationCode = async ({ code, codeVerifier }) => {
  const response = await fetch(`${config.oidc.issuer}/api/v1/oauth/token`, {
    method: "POST",

    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },

    body: new URLSearchParams({
      grant_type: "authorization_code",

      code,

      redirect_uri: config.oidc.redirectUri,

      client_id: config.oidc.clientId,

      client_secret: config.oidc.clientSecret,

      code_verifier: codeVerifier,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      data?.error?.message ||
        data?.error_description ||
        "Échec de l'échange du code OAuth",
    );

    error.code = data?.error?.code || data?.error || "TOKEN_EXCHANGE_FAILED";

    throw error;
  }

  return data;
};

export const verifyIdToken = async ({ idToken, nonce }) => {
  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: config.oidc.issuer,
    audience: config.oidc.clientId,
    algorithms: ["RS256"],
  });

  if (!payload.sub) {
    throw new Error("Le ID Token ne contient pas de subject");
  }

  if (!payload.nonce || payload.nonce !== nonce) {
    throw new Error("Nonce OIDC invalide");
  }

  return payload;
};

export const fetchUserInfo = async (accessToken) => {
  const response = await fetch(`${config.oidc.issuer}/api/v1/oauth/userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Impossible de récupérer UserInfo");
  }

  return data;
};

export const buildLogoutUrl = ({ idToken, state }) => {
  const url = new URL(`${config.oidc.issuer}/api/v1/oidc/end-session`);

  url.searchParams.set("id_token_hint", idToken);

  url.searchParams.set(
    "post_logout_redirect_uri",
    config.oidc.postLogoutRedirectUri,
  );

  url.searchParams.set("state", state);

  return url.toString();
};
export const verifyLogoutToken = async (logoutToken) => {
  if (!logoutToken || typeof logoutToken !== "string") {
    throw new Error("logout_token absent");
  }

  const { payload } = await jwtVerify(logoutToken, jwks, {
    issuer: config.oidc.issuer,
    audience: config.oidc.clientId,
    algorithms: ["RS256"],
  });

  if (!payload.sid) {
    throw new Error("Le logout_token ne contient pas de sid");
  }

  if (!payload.sub) {
    throw new Error("Le logout_token ne contient pas de sub");
  }

  if (payload.nonce !== undefined) {
    throw new Error("Un logout_token ne doit pas contenir de nonce");
  }

  if (
    !payload.events ||
    typeof payload.events !== "object" ||
    !payload.events[BACKCHANNEL_LOGOUT_EVENT]
  ) {
    throw new Error("Événement Back-Channel Logout invalide");
  }

  return payload;
};
