import express from "express";

import * as oidcService from "../services/oidc.service.js";

const router = express.Router();

const destroySessionByOidcSid = ({ store, oidcSid }) =>
  new Promise((resolve, reject) => {
    store.all((error, sessions) => {
      if (error) {
        return reject(error);
      }

      const entries = Object.entries(sessions || {});

      const matchingSession = entries.find(
        ([, sessionData]) => sessionData?.oidcSid === oidcSid,
      );

      if (!matchingSession) {
        return resolve(false);
      }

      const [sessionId] = matchingSession;

      store.destroy(sessionId, (destroyError) => {
        if (destroyError) {
          return reject(destroyError);
        }

        return resolve(true);
      });
    });
  });

router.get("/status", (req, res) => {
  return res.json({
    authenticated: Boolean(req.session.user),

    user: req.session.user || null,

    oidc: req.session.user
      ? {
          provider: "CHAD-SSO",
          protocol: "OpenID Connect",
          verified: true,
          sid: req.session.oidcSid || null,
        }
      : null,
  });
});

router.get("/login", (req, res, next) => {
  try {
    const state = oidcService.generateRandomValue();
    const nonce = oidcService.generateRandomValue();

    const { codeVerifier, codeChallenge } = oidcService.generatePkce();

    /*
     * Ces informations restent uniquement
     * dans la session locale SIGFIP.
     */
    req.session.oidc = {
      state,
      nonce,
      codeVerifier,
      createdAt: Date.now(),
    };

    const authorizationUrl = oidcService.buildAuthorizationUrl({
      state,
      nonce,
      codeChallenge,
    });

    /*
     * Sauvegardons explicitement la session
     * avant de quitter SIGFIP.
     */
    req.session.save((error) => {
      if (error) {
        return next(error);
      }

      return res.redirect(302, authorizationUrl);
    });
  } catch (error) {
    next(error);
  }
});

router.get("/callback", async (req, res, next) => {
  try {
    const { code, state, error } = req.query;

    /*
     * Le fournisseur OIDC peut retourner
     * une erreur au lieu d'un code.
     */
    if (error) {
      throw new Error(`Erreur OIDC : ${error}`);
    }

    if (!code || !state) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_CALLBACK",
          message: "Code ou state absent du callback OIDC",
        },
      });
    }

    /*
     * Transaction créée avant le départ
     * vers CHAD-SSO.
     */
    const transaction = req.session.oidc;

    if (!transaction) {
      return res.status(400).json({
        success: false,
        error: {
          code: "OIDC_TRANSACTION_NOT_FOUND",
          message: "Transaction OIDC introuvable ou expirée",
        },
      });
    }

    /*
     * Protection CSRF.
     */
    if (state !== transaction.state) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_STATE",
          message: "State OIDC invalide",
        },
      });
    }

    /*
     * Le code est échangé avec le
     * code_verifier PKCE original.
     */
    const tokens = await oidcService.exchangeAuthorizationCode({
      code,
      codeVerifier: transaction.codeVerifier,
    });

    if (!tokens.access_token || !tokens.id_token) {
      throw new Error("Réponse token CHAD-SSO incomplète");
    }

    /*
     * Vérification cryptographique du
     * ID Token avec les clés publiques
     * JWKS de CHAD-SSO.
     *
     * jwtVerify contrôle notamment :
     * - signature RS256
     * - issuer
     * - audience
     * - expiration
     */
    const identity = await oidcService.verifyIdToken({
      idToken: tokens.id_token,
      nonce: transaction.nonce,
    });

    /*
     * Récupération des informations
     * complémentaires de l'utilisateur.
     */
    const userInfo = await oidcService.fetchUserInfo(tokens.access_token);

    /*
     * Défense supplémentaire :
     * ID Token et UserInfo doivent
     * désigner le même utilisateur.
     */
    if (!userInfo.sub || userInfo.sub !== identity.sub) {
      throw new Error("Incohérence entre ID Token et UserInfo");
    }

    if (!identity.sid) {
      throw new Error("Le ID Token CHAD-SSO ne contient pas de sid");
    }

    /*
     * Création de la session locale SIGFIP.
     *
     * SIGFIP ne stocke pas le mot de passe
     * de l'utilisateur.
     */
    req.session.user = {
      sub: identity.sub,

      matricule: userInfo.matricule || identity.matricule || null,

      name: userInfo.name || identity.name || null,

      email: userInfo.email || identity.email || null,
    };

    req.session.oidcSid = identity.sid;

    /*
     * Nécessaire pour le logout OIDC.
     */
    req.session.idToken = tokens.id_token;

    /*
     * Pour le démonstrateur seulement,
     * nous conservons également les tokens
     * côté serveur dans la session Express.
     */
    req.session.tokens = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
    };

    /*
     * La transaction state/nonce/PKCE
     * n'est plus nécessaire.
     */
    delete req.session.oidc;

    req.session.save((saveError) => {
      if (saveError) {
        return next(saveError);
      }

      return res.redirect("/home.html");
    });
  } catch (error) {
    return next(error);
  }
});
router.get("/logout", async (req, res, next) => {
  try {
    /*
     * Sans session SIGFIP authentifiée,
     * retour direct à l'accueil.
     */
    if (!req.session?.user) {
      return res.redirect("/");
    }

    const idToken = req.session.idToken;

    if (!idToken) {
      req.session.destroy(() => {
        return res.redirect("/");
      });

      return;
    }

    /*
     * State utilisé pour le retour
     * de logout OIDC.
     */
    const logoutState = oidcService.generateRandomValue();

    const logoutUrl = oidcService.buildLogoutUrl({
      idToken,
      state: logoutState,
    });

    /*
     * La session locale SIGFIP est
     * détruite avant le logout central.
     */
    req.session.destroy((error) => {
      if (error) {
        return next(error);
      }

      /*
       * Suppression explicite du cookie
       * Express côté navigateur.
       */
      res.clearCookie("sigfop.sid", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });

      return res.redirect(302, logoutUrl);
    });
  } catch (error) {
    return next(error);
  }
});

router.post(
  "/backchannel-logout",
  express.urlencoded({ extended: false }),
  async (req, res) => {
    try {
      const logoutToken = req.body.logout_token;

      if (!logoutToken) {
        return res.status(400).json({
          success: false,
          error: {
            code: "LOGOUT_TOKEN_REQUIRED",
            message: "logout_token obligatoire",
          },
        });
      }

      const payload = await oidcService.verifyLogoutToken(logoutToken);

      const destroyed = await destroySessionByOidcSid({
        store: req.app.locals.sessionStore,
        oidcSid: payload.sid,
      });

      console.log(
        `[OIDC Back-Channel Logout] sid=${payload.sid} destroyed=${destroyed}`,
      );

      /*
       * Une session déjà absente ne constitue pas une erreur.
       * Le endpoint reste idempotent.
       */
      return res.status(200).json({
        success: true,
      });
    } catch (error) {
      console.error("[OIDC Back-Channel Logout]", error.message);

      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_LOGOUT_TOKEN",
          message: "logout_token invalide",
        },
      });
    }
  },
);

export default router;
