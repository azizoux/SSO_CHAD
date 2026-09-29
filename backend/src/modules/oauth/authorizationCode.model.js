import mongoose from "mongoose";

const authorizationCodeSchema = new mongoose.Schema(
  {
    /**
     * On ne stocke jamais le code OAuth brut.
     * Seul son hash SHA-256 est conservé.
     */
    codeHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
      select: false,
    },

    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true,
    },

    redirectUri: {
      type: String,
      required: true,
    },

    scopes: {
      type: [String],
      required: true,
      default: [],
    },

    /**
     * PKCE
     */
    codeChallenge: {
      type: String,
      required: true,
    },

    codeChallengeMethod: {
      type: String,
      enum: ["S256"],
      required: true,
      default: "S256",
    },

    status: {
      type: String,
      enum: ["ACTIVE", "USED", "REVOKED"],
      default: "ACTIVE",
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    usedAt: {
      type: Date,
      default: null,
    },

    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Suppression automatique des anciens codes.
 */
authorizationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const AuthorizationCode = mongoose.model(
  "AuthorizationCode",
  authorizationCodeSchema,
);

export default AuthorizationCode;
