import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    sessionTokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
      select: false,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "REVOKED", "EXPIRED"],
      default: "ACTIVE",
      index: true,
    },

    ipAddress: {
      type: String,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
    },

    authenticatedAt: {
      type: Date,
      default: Date.now,
    },

    lastActivityAt: {
      type: Date,
      default: Date.now,
    },

    participants: {
      type: [
        {
          application: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Application",
            required: true,
          },

          clientId: {
            type: String,
            required: true,
          },

          joinedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    revokedAt: {
      type: Date,
      default: null,
    },

    revokeReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * TTL index.
 *
 * MongoDB supprimera automatiquement le document
 * lorsque la date contenue dans expiresAt sera atteinte.
 */
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session = mongoose.model("Session", sessionSchema);

export default Session;
