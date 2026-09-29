import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    matricule: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
      index: true,
    },

    phone: {
      type: String,
      trim: true,
      default: null,
    },

    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "LOCKED", "SUSPENDED", "DISABLED"],
      default: "ACTIVE",
      index: true,
    },

    /**
     * Il s'agit des rôles d'administration du SSO,
     * pas des rôles métier de SIGFIP/SIGFOP/etc.
     */
    roles: {
      type: [String],
      enum: [
        "SUPER_ADMIN",
        "SSO_ADMIN",
        "ORGANIZATION_ADMIN",
        "SECURITY_AUDITOR",
        "USER",
      ],
      default: ["USER"],
    },

    mfa: {
      enabled: {
        type: Boolean,
        default: false,
      },

      methods: {
        type: [String],
        enum: ["TOTP", "SMS", "EMAIL"],
        default: [],
      },
    },

    failedLoginAttempts: {
      type: Number,
      default: 0,
    },

    lockedUntil: {
      type: Date,
      default: null,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },

    lastFailedLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Protection supplémentaire :
 * passwordHash ne doit jamais sortir par JSON.
 */
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});

userSchema.set("toObject", {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});

const User = mongoose.model("User", userSchema);

export default User;
