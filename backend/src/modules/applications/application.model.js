// src/modules/applications/application.model.js

import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    description: {
      type: String,
      default: null,
    },

    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    clientId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    /**
     * Jamais de clientSecret en clair en base.
     */
    clientSecretHash: {
      type: String,
      select: false,
      default: null,
    },

    clientType: {
      type: String,
      enum: ["PUBLIC", "CONFIDENTIAL"],
      required: true,
      default: "CONFIDENTIAL",
      index: true,
    },

    protocol: {
      type: String,
      enum: ["OIDC"],
      default: "OIDC",
    },

    redirectUris: {
      type: [String],
      default: [],
    },

    postLogoutRedirectUris: {
      type: [String],
      default: [],
    },

    allowedScopes: {
      type: [String],
      default: ["openid", "profile"],
    },

    grantTypes: {
      type: [String],
      default: ["authorization_code", "refresh_token"],
    },

    requirePkce: {
      type: Boolean,
      default: true,
    },

    accessTokenLifetime: {
      type: Number,
      default: 900,
    },

    refreshTokenLifetime: {
      type: Number,
      default: 604800,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
      default: "ACTIVE",
      index: true,
    },
    backchannelLogoutUri: {
      type: String,
      default: null,
    },
    backchannelLogoutSessionRequired: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

applicationSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.clientSecretHash;
    return ret;
  },
});

applicationSchema.set("toObject", {
  transform: (doc, ret) => {
    delete ret.clientSecretHash;
    return ret;
  },
});

const Application = mongoose.model("Application", applicationSchema);

export default Application;
