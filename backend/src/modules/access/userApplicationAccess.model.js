import mongoose from "mongoose";

const userApplicationAccessSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      index: true,
    },

    roles: {
      type: [String],
      default: [],
    },

    scopes: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED", "REVOKED"],
      default: "ACTIVE",
      index: true,
    },

    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    grantedAt: {
      type: Date,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    revokedAt: {
      type: Date,
      default: null,
    },

    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    revokeReason: {
      type: String,
      default: null,
      trim: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

userApplicationAccessSchema.index(
  {
    user: 1,
    application: 1,
  },
  {
    unique: true,
    name: "uniq_user_application_access",
  },
);

userApplicationAccessSchema.index({
  application: 1,
  status: 1,
});

userApplicationAccessSchema.index({
  user: 1,
  status: 1,
});

const UserApplicationAccess = mongoose.model(
  "UserApplicationAccess",
  userApplicationAccessSchema,
);

export default UserApplicationAccess;
