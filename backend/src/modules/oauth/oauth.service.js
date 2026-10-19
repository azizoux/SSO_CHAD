import bcrypt from "bcryptjs";

import User from "../users/user.model.js";
import Application from "../applications/application.model.js";

import * as sessionService from "../sessions/session.service.js";
import * as authorizationCodeService from "./authorizationCode.service.js";
import * as tokenService from "./token.service.js";
import * as refreshTokenService from "./refreshToken.service.js";
import * as accessService from "../access/userApplicationAccess.service.js";

import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
} from "../../shared/errors/index.js";

import { sha256Base64Url } from "../../shared/utils/crypto.js";

/**
 * OAuth 2.0 / OpenID Connect
 *
 * Authorization Endpoint.
 *
 * Responsabilités :
 * - validation métier du client
 * - validation redirect_uri
 * - validation des scopes
 * - validation de la session SSO
 * - création du Authorization Code
 *
 * La validation structurelle est réalisée
 * par oauth.validators.js.
 */
export const authorize = async ({
  clientId,
  redirectUri,
  responseType,
  scope,
  state,
  nonce,
  codeChallenge,
  codeChallengeMethod,
  sessionToken,
}) => {
  /**
   * Authorization Code Flow uniquement.
   *
   * Cette vérification est également réalisée
   * par le validator. Nous la conservons ici
   * comme protection métier supplémentaire.
   */
  if (responseType !== "code") {
    throw new BadRequestError(
      "response_type non supporté",
      "UNSUPPORTED_RESPONSE_TYPE",
    );
  }

  if (!nonce || typeof nonce !== "string") {
    throw new BadRequestError("nonce OIDC obligatoire", "OIDC_NONCE_REQUIRED");
  }

  /**
   * Recherche du client OIDC.
   */
  const application = await Application.findOne({
    clientId,
    status: "ACTIVE",
  });

  if (!application) {
    throw new BadRequestError("Client OAuth invalide", "INVALID_CLIENT");
  }

  /**
   * Vérification STRICTE de redirect_uri.
   *
   * Correspondance exacte uniquement.
   *
   * Pas de startsWith().
   * Pas de regex.
   */
  if (!application.redirectUris.includes(redirectUri)) {
    throw new BadRequestError(
      "redirect_uri non autorisée",
      "INVALID_REDIRECT_URI",
    );
  }

  /**
   * Vérification PKCE.
   */
  if (!codeChallenge) {
    throw new BadRequestError("code_challenge obligatoire", "PKCE_REQUIRED");
  }

  if (codeChallengeMethod !== "S256") {
    throw new BadRequestError(
      "code_challenge_method doit être S256",
      "PKCE_METHOD_NOT_SUPPORTED",
    );
  }

  /**
   * Transformation de la chaîne scope
   * en tableau.
   */
  const requestedScopes = scope
    ? scope
        .split(" ")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  /**
   * OpenID Connect exige le scope openid.
   */
  if (!requestedScopes.includes("openid")) {
    throw new BadRequestError(
      "Le scope openid est obligatoire",
      "OPENID_SCOPE_REQUIRED",
    );
  }

  /**
   * Vérification des scopes autorisés
   * pour l'application.
   */
  const invalidScopes = requestedScopes.filter(
    (requestedScope) => !application.allowedScopes.includes(requestedScope),
  );

  if (invalidScopes.length > 0) {
    throw new BadRequestError(
      `Scopes non autorisés : ${invalidScopes.join(", ")}`,
      "INVALID_SCOPE",
      {
        invalidScopes,
      },
    );
  }

  /**
   * Vérification de la session SSO.
   *
   * Pour le prototype CLI, le token de
   * session arrive via x-sso-session.
   *
   * Plus tard :
   * cookie sécurisé HttpOnly.
   */
  const session = await sessionService.getSessionByToken(sessionToken);

  if (!session) {
    throw new UnauthorizedError(
      "Authentification SSO requise",
      "LOGIN_REQUIRED",
    );
  }

  /**
   * Une session peut exister alors que
   * le compte utilisateur a été désactivé.
   */
  if (!session.user || session.user.status !== "ACTIVE") {
    throw new ForbiddenError("Utilisateur non autorisé", "USER_NOT_ALLOWED");
  }

  /**
   * Vérification de l'habilitation de l'utilisateur
   * pour l'application cliente.
   *
   * Une session SSO valide ne signifie pas automatiquement
   * que l'utilisateur est autorisé à accéder à toutes
   * les applications raccordées à CHAD-SSO.
   */
  const access = await accessService.getActiveAccess({
    userId: session.user._id,
    applicationId: application._id,
  });

  if (!access) {
    throw new ForbiddenError(
      "Utilisateur non habilité à accéder à cette application",
      "APPLICATION_ACCESS_DENIED",
    );
  }

  /**
   * Les scopes doivent être autorisés à deux niveaux :
   *
   * 1. par l'application ;
   * 2. par l'habilitation de l'utilisateur.
   *
   * La première vérification a déjà été effectuée plus haut.
   */
  const unauthorizedAccessScopes = requestedScopes.filter(
    (requestedScope) => !access.scopes.includes(requestedScope),
  );

  if (unauthorizedAccessScopes.length > 0) {
    throw new ForbiddenError(
      `Scopes non autorisés pour cet utilisateur : ${unauthorizedAccessScopes.join(", ")}`,
      "ACCESS_SCOPE_DENIED",
      {
        unauthorizedScopes: unauthorizedAccessScopes,
      },
    );
  }

  /**
   * L'application devient participante à la session SSO
   * uniquement après validation de son habilitation.
   */
  await sessionService.registerParticipant({
    sessionId: session._id,
    applicationId: application._id,
    clientId: application.clientId,
  });

  /**
   * Création du Authorization Code.
   *
   * Le code brut est retourné une seule fois.
   * Seul son hash est conservé en base.
   */
  const authorization = await authorizationCodeService.createAuthorizationCode({
    applicationId: application._id,

    userId: session.user._id,

    sessionId: session._id,

    redirectUri,

    scopes: requestedScopes,
    nonce,

    codeChallenge,

    codeChallengeMethod,
  });

  return {
    code: authorization.code,

    state: state || null,

    redirectUri,
  };
};

/**
 * Token Endpoint.
 *
 * Échange :
 *
 * Authorization Code
 *        +
 * client authentication
 *        +
 * PKCE verifier
 *
 * contre :
 *
 * Access Token
 *        +
 * ID Token
 */
export const exchangeAuthorizationCode = async ({
  grantType,
  code,
  redirectUri,
  clientId,
  clientSecret,
  codeVerifier,
}) => {
  /**
   * Authorization Code Grant uniquement.
   *
   * Vérification également présente
   * dans oauth.validators.js.
   */
  if (grantType !== "authorization_code") {
    throw new BadRequestError(
      "grant_type non supporté",
      "UNSUPPORTED_GRANT_TYPE",
    );
  }

  /**
   * Protection supplémentaire du service
   * s'il est appelé ailleurs que depuis
   * la route HTTP.
   */
  if (!code || !redirectUri || !clientId || !codeVerifier) {
    throw new BadRequestError(
      "Paramètres OAuth obligatoires manquants",
      "INVALID_TOKEN_REQUEST",
    );
  }

  /**
   * Recherche du client indépendamment
   * du Authorization Code.
   *
   * clientSecretHash est select:false
   * dans le modèle, donc sélection
   * explicite ici.
   */
  const application = await Application.findOne({
    clientId,
    status: "ACTIVE",
  }).select("+clientSecretHash");

  if (!application) {
    throw new UnauthorizedError("Client OAuth invalide", "INVALID_CLIENT");
  }

  /**
   * Les clients CONFIDENTIAL doivent
   * obligatoirement s'authentifier.
   *
   * Un client PUBLIC n'utilise pas
   * client_secret.
   */
  if (application.clientType === "CONFIDENTIAL") {
    if (!clientSecret || !application.clientSecretHash) {
      throw new UnauthorizedError(
        "Authentification du client requise",
        "CLIENT_AUTHENTICATION_REQUIRED",
      );
    }

    const clientAuthenticated = await bcrypt.compare(
      clientSecret,
      application.clientSecretHash,
    );

    if (!clientAuthenticated) {
      throw new UnauthorizedError(
        "Authentification du client invalide",
        "INVALID_CLIENT",
      );
    }
  }

  /**
   * PKCE.
   *
   * Le code_verifier fourni au Token
   * Endpoint doit produire exactement
   * le code_challenge enregistré lors
   * de /authorize.
   */
  const calculatedChallenge = sha256Base64Url(codeVerifier);

  /**
   * Consommation atomique.
   *
   * Cette opération :
   * - vérifie le code
   * - vérifie l'application
   * - vérifie redirect_uri
   * - vérifie PKCE
   * - vérifie l'expiration
   * - vérifie status ACTIVE
   * - passe immédiatement le code à USED
   *
   * Elle empêche donc le replay.
   */
  const authorizationCode =
    await authorizationCodeService.consumeAuthorizationCode({
      code,

      applicationId: application._id,

      redirectUri,

      codeChallenge: calculatedChallenge,
    });

  if (!authorizationCode) {
    throw new BadRequestError(
      "Code d'autorisation invalide, expiré ou vérification PKCE échouée",
      "INVALID_AUTHORIZATION_CODE",
    );
  }

  const user = authorizationCode.user;

  const session = authorizationCode.session;

  if (!user || user.status !== "ACTIVE") {
    throw new ForbiddenError(
      "Compte utilisateur suspendu ou désactivé",
      "USER_NOT_ALLOWED",
    );
  }

  /**
   * La session SSO associée au code
   * doit toujours être valide au moment
   * de l'émission des tokens.
   */
  if (
    !session ||
    session.status !== "ACTIVE" ||
    session.expiresAt <= new Date()
  ) {
    throw new UnauthorizedError(
      "Session SSO invalide ou expirée",
      "INVALID_SSO_SESSION",
    );
  }

  const access = await accessService.getActiveAccess({
    userId: user._id,
    applicationId: application._id,
  });

  if (!access) {
    throw new ForbiddenError(
      "Utilisateur non habilité à accéder à cette application",
      "APPLICATION_ACCESS_DENIED",
    );
  }

  const unauthorizedScopes = authorizationCode.scopes.filter(
    (scope) => !access.scopes.includes(scope),
  );

  if (unauthorizedScopes.length > 0) {
    throw new ForbiddenError(
      "Scopes non autorisés pour cet utilisateur",
      "ACCESS_SCOPE_DENIED",
      { unauthorizedScopes },
    );
  }

  /**
   * Access Token signé RS256.
   */
  const { accessToken, expiresIn } = tokenService.createAccessToken({
    user,
    application,
    scopes: authorizationCode.scopes,
    session,
    applicationRoles: access.roles,
  });

  /**
   * OpenID Connect ID Token signé RS256.
   */
  const idToken = tokenService.createIdToken({
    user,
    application,
    scopes: authorizationCode.scopes,
    session,
    nonce: authorizationCode.nonce,
  });

  const { refreshToken } = await refreshTokenService.createRefreshToken({
    application: authorizationCode.application,

    user: authorizationCode.user,

    session: authorizationCode.session,

    scopes: authorizationCode.scopes,
  });

  return {
    accessToken,
    idToken,
    refreshToken,
    expiresIn,
    scopes: authorizationCode.scopes,
  };
};

export const getUserInfo = async ({ subject, scope }) => {
  if (!subject) {
    throw new UnauthorizedError(
      "Sujet du token invalide",
      "INVALID_ACCESS_TOKEN",
    );
  }

  const user = await User.findById(subject);

  if (!user || user.status !== "ACTIVE") {
    throw new UnauthorizedError(
      "Utilisateur introuvable ou inactif",
      "USER_NOT_AVAILABLE",
    );
  }

  const scopes = new Set(
    String(scope || "")
      .split(" ")
      .filter(Boolean),
  );

  /**
   * sub est toujours retourné.
   */
  const userInfo = {
    sub: user._id.toString(),
  };

  /**
   * Scope profile.
   */
  if (scopes.has("profile")) {
    userInfo.name = `${user.firstName} ${user.lastName}`.trim();

    userInfo.given_name = user.firstName;

    userInfo.family_name = user.lastName;

    userInfo.matricule = user.matricule;
  }

  /**
   * Scope email.
   */
  if (scopes.has("email") && user.email) {
    userInfo.email = user.email;
  }

  return userInfo;
};

export const exchangeRefreshToken = async ({
  refreshToken,
  clientId,
  clientSecret,
}) => {
  /*
   * On regarde d'abord si le token existe.
   *
   * Cela nous permettra de distinguer un token inconnu
   * d'un token déjà consommé.
   */
  const existing = await refreshTokenService.findRefreshToken(refreshToken);

  if (!existing) {
    throw new BadRequestError(
      "Refresh Token invalide",
      "INVALID_REFRESH_TOKEN",
    );
  }

  /**
   * Vérification du client associé au Refresh Token.
   *
   * Le client doit :
   * - exister ;
   * - correspondre au client_id demandé ;
   * - être toujours ACTIVE.
   */
  if (!existing.application || existing.application.clientId !== clientId) {
    throw new UnauthorizedError("Client OAuth invalide", "INVALID_CLIENT");
  }

  if (existing.application.status !== "ACTIVE") {
    await refreshTokenService.revokeFamily({
      familyId: existing.familyId,
      reason: "APPLICATION_NOT_ACTIVE",
    });

    throw new ForbiddenError(
      "Cette application a été désactivée",
      "APPLICATION_NOT_ACTIVE",
    );
  }

  /*
   * Authentification du client confidentiel.
   */
  if (existing.application.clientType === "CONFIDENTIAL") {
    if (!clientSecret) {
      throw new UnauthorizedError(
        "Authentification du client requise",
        "CLIENT_AUTHENTICATION_REQUIRED",
      );
    }

    /*
     * clientSecretHash est select:false.
     * Il faut donc récupérer explicitement
     * l'application avec son hash.
     */
    const application = await Application.findById(
      existing.application._id,
    ).select("+clientSecretHash");

    if (!application) {
      throw new UnauthorizedError("Client invalide", "INVALID_CLIENT");
    }

    const validSecret = await bcrypt.compare(
      clientSecret,
      application.clientSecretHash,
    );

    if (!validSecret) {
      throw new UnauthorizedError("Client invalide", "INVALID_CLIENT");
    }
  }

  /*
   * Un token USED/REVOKED ne doit jamais être accepté.
   */
  if (existing.status === "USED") {
    await refreshTokenService.revokeFamily({
      familyId: existing.familyId,

      reason: "REFRESH_TOKEN_REUSE_DETECTED",
    });

    throw new UnauthorizedError(
      "Réutilisation d'un Refresh Token détectée",
      "REFRESH_TOKEN_REUSE_DETECTED",
    );
  }

  if (existing.status === "REVOKED" || existing.expiresAt <= new Date()) {
    throw new BadRequestError(
      "Refresh Token invalide, expiré ou révoqué",
      "INVALID_REFRESH_TOKEN",
    );
  }

  /*
   * Consommation atomique.
   */
  const consumed = await refreshTokenService.consumeRefreshToken(refreshToken);

  if (!consumed) {
    throw new UnauthorizedError(
      "Refresh Token déjà consommé, expiré ou révoqué",
      "INVALID_REFRESH_TOKEN",
    );
  }

  /**
   * Revérification du statut du client
   * après consommation atomique.
   */
  const currentApplication = await Application.findById(
    consumed.application?._id,
  );

  if (!currentApplication || currentApplication.status !== "ACTIVE") {
    await refreshTokenService.revokeFamily({
      familyId: consumed.familyId,
      reason: "APPLICATION_NOT_ACTIVE",
    });

    throw new ForbiddenError(
      "Application désactivée ou indisponible",
      "APPLICATION_NOT_ACTIVE",
    );
  }

  // Utiliser ensuite currentApplication pour les
  // contrôles des scopes et la création des jetons.

  /*
   * La session SSO doit toujours être valide.
   */
  if (
    !consumed.session ||
    consumed.session.status !== "ACTIVE" ||
    consumed.session.expiresAt <= new Date()
  ) {
    await refreshTokenService.revokeFamily({
      familyId: consumed.familyId,
      reason: "INVALID_SSO_SESSION",
    });

    throw new UnauthorizedError(
      "Session SSO invalide ou expirée",
      "INVALID_SSO_SESSION",
    );
  }

  /*
   * L'utilisateur doit toujours être actif.
   */
  if (!consumed.user || consumed.user.status !== "ACTIVE") {
    await refreshTokenService.revokeFamily({
      familyId: consumed.familyId,
      reason: "USER_NOT_ALLOWED",
    });

    throw new ForbiddenError("Utilisateur non autorisé", "USER_NOT_ALLOWED");
  }

  /*
   * L'habilitation applicative doit toujours être active.
   *
   * Une authentification SSO valide ne suffit pas :
   * l'utilisateur doit encore être habilité pour
   * l'application qui demande le renouvellement.
   */
  const access = await accessService.getActiveAccess({
    userId: consumed.user._id,
    applicationId: currentApplication._id,
  });

  if (!access) {
    await refreshTokenService.revokeFamily({
      familyId: consumed.familyId,
      reason: "APPLICATION_ACCESS_DENIED",
    });

    throw new ForbiddenError(
      "L'habilitation de l'utilisateur pour cette application n'est plus active",
      "APPLICATION_ACCESS_DENIED",
    );
  }

  /**
   * Les scopes doivent rester autorisés :
   * - par l'application ;
   * - par l'habilitation actuelle.
   */

  const unauthorizedScopes = consumed.scopes.filter(
    (requestedScope) =>
      !currentApplication.allowedScopes.includes(requestedScope) ||
      !access.scopes.includes(requestedScope),
  );

  if (unauthorizedScopes.length > 0) {
    await refreshTokenService.revokeFamily({
      familyId: consumed.familyId,
      reason: "ACCESS_SCOPE_DENIED",
    });

    throw new ForbiddenError(
      `Scopes non autorisés pour cet utilisateur : ${unauthorizedScopes.join(", ")}`,
      "ACCESS_SCOPE_DENIED",
      {
        unauthorizedScopes,
      },
    );
  }

  /*
   * Rotation :
   * création du prochain Refresh Token.
   */
  const replacement = await refreshTokenService.createRefreshToken({
    application: currentApplication,
    user: consumed.user,
    session: consumed.session,
    scopes: consumed.scopes,
    familyId: consumed.familyId,
    parentTokenId: consumed._id,
  });

  await refreshTokenService.setReplacement({
    refreshTokenId: consumed._id,

    replacementId: replacement.document._id,
  });

  /*
   * Nouvel Access Token.
   */
  const { accessToken, expiresIn } = tokenService.createAccessToken({
    user: consumed.user,
    application: currentApplication,
    scopes: consumed.scopes,
    session: consumed.session,
    applicationRoles: access.roles,
  });

  return {
    accessToken,
    refreshToken: replacement.refreshToken,
    expiresIn,
    scopes: consumed.scopes,
  };
};
