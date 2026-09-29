import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    shortName: {
      type: String,
      trim: true,
      uppercase: true,
    },

    type: {
      type: String,
      enum: [
        "MINISTRY",
        "PUBLIC_AGENCY",
        "PUBLIC_INSTITUTION",
        "STATE_COMPANY",
        "OTHER",
      ],
      default: "MINISTRY",
      index: true,
    },

    parentOrganization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },

    description: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
      default: "ACTIVE",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

const Organization = mongoose.model("Organization", organizationSchema);
export default Organization;
