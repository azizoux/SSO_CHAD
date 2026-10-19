/**
 * CHAD-SSO
 * Politique centrale des habilitations applicatives.
 *
 * Ce module évalue des données déjà chargées
 * depuis des sources fiables côté serveur.
 *
 * Il ne réalise aucune requête MongoDB.
 */

const DENIAL_REASONS = Object.freeze({
  USER_NOT_ACTIVE: "USER_NOT_ACTIVE",
  APPLICATION_NOT_ACTIVE: "APPLICATION_NOT_ACTIVE",
  APPLICATION_ACCESS_DENIED: "APPLICATION_ACCESS_DENIED",
  INVALID_SCOPE: "INVALID_SCOPE",
  INSUFFICIENT_SCOPE: "INSUFFICIENT_SCOPE",
  OPENID_REQUIRED: "OPENID_REQUIRED",
});

function deny(reason) {
  return {
    allowed: false,
    reason,
    scopes: [],
    roles: [],
  };
}

export function evaluateApplicationAccess({
  user,
  application,
  access,
  requestedScopes = [],
}) {
  // 1. Vérifier le compte utilisateur.
  if (!user || user.status !== "ACTIVE") {
    return deny(DENIAL_REASONS.USER_NOT_ACTIVE);
  }

  // 2. Vérifier l'application cliente.
  if (!application || application.status !== "ACTIVE") {
    return deny(DENIAL_REASONS.APPLICATION_NOT_ACTIVE);
  }

  // 3. Vérifier l'habilitation.
  if (!access || access.status !== "ACTIVE") {
    return deny(DENIAL_REASONS.APPLICATION_ACCESS_DENIED);
  }

  // 4. Vérifier la structure des scopes.
  if (
    !Array.isArray(requestedScopes) ||
    requestedScopes.some(
      (scope) => typeof scope !== "string" || scope.length === 0,
    )
  ) {
    return deny(DENIAL_REASONS.INVALID_SCOPE);
  }

  const scopes = [...new Set(requestedScopes)];

  // 5. Exiger openid pour le flux OIDC.
  if (!scopes.includes("openid")) {
    return deny(DENIAL_REASONS.OPENID_REQUIRED);
  }

  // 6. Construire les ensembles autorisés.
  const applicationScopes = new Set(application.allowedScopes || []);

  const accessScopes = new Set(access.scopes || []);

  // 7. Tous les scopes demandés doivent être
  // autorisés par l'application ET l'habilitation.
  const scopesAllowed = scopes.every(
    (scope) => applicationScopes.has(scope) && accessScopes.has(scope),
  );

  if (!scopesAllowed) {
    return deny(DENIAL_REASONS.INSUFFICIENT_SCOPE);
  }

  // 8. Retourner uniquement les rôles applicatifs.
  const roles = Array.isArray(access.roles)
    ? [
        ...new Set(
          access.roles.filter(
            (role) => typeof role === "string" && role.length > 0,
          ),
        ),
      ]
    : [];

  return {
    allowed: true,
    reason: "ACCESS_GRANTED",
    scopes,
    roles,
  };
}

export { DENIAL_REASONS };
