import crypto from "crypto";
import bcrypt from "bcryptjs";

import Application from "./application.model.js";
import Organization from "../organizations/organization.model.js";

const generateClientId = (code) => {
  const randomPart = crypto.randomBytes(8).toString("hex");

  return `${code.toLowerCase()}-${randomPart}`;
};

const generateClientSecret = () => {
  return `sso_${crypto.randomBytes(32).toString("hex")}`;
};

export const createApplication = async (data) => {
  const code = data.code?.trim().toUpperCase();

  if (!code) {
    const error = new Error("Le code de l'application est obligatoire");
    error.statusCode = 400;
    throw error;
  }

  if (!data.name?.trim()) {
    const error = new Error("Le nom de l'application est obligatoire");
    error.statusCode = 400;
    throw error;
  }

  if (!data.organization) {
    const error = new Error(
      "L'organisation propriétaire de l'application est obligatoire",
    );
    error.statusCode = 400;
    throw error;
  }

  const existingApplication = await Application.findOne({ code });

  if (existingApplication) {
    const error = new Error(`Une application avec le code ${code} existe déjà`);
    error.statusCode = 409;
    throw error;
  }

  const organization = await Organization.findById(data.organization);

  if (!organization) {
    const error = new Error("Organisation propriétaire introuvable");
    error.statusCode = 400;
    throw error;
  }

  if (organization.status !== "ACTIVE") {
    const error = new Error("L'organisation propriétaire n'est pas active");
    error.statusCode = 400;
    throw error;
  }

  const clientType = data.clientType?.toUpperCase() || "CONFIDENTIAL";

  const clientId = generateClientId(code);

  let clientSecret = null;
  let clientSecretHash = null;

  /**
   * Une application CONFIDENTIAL reçoit un secret.
   *
   * Une application PUBLIC, comme une SPA React,
   * ne doit pas embarquer de secret.
   */
  if (clientType === "CONFIDENTIAL") {
    clientSecret = generateClientSecret();
    clientSecretHash = await bcrypt.hash(clientSecret, 12);
  }

  const application = await Application.create({
    name: data.name.trim(),
    code,
    description: data.description ?? null,
    organization: organization._id,
    clientId,
    clientSecretHash,
    clientType,
    protocol: "OIDC",
    redirectUris: data.redirectUris || [],
    postLogoutRedirectUris: data.postLogoutRedirectUris || [],
    allowedScopes: data.allowedScopes || ["openid", "profile"],
    grantTypes: data.grantTypes || ["authorization_code", "refresh_token"],
    requirePkce:
      data.requirePkce !== undefined ? Boolean(data.requirePkce) : true,
    accessTokenLifetime: data.accessTokenLifetime || 900,
    refreshTokenLifetime: data.refreshTokenLifetime || 604800,
    status: "ACTIVE",
  });

  /**
   * Transformer le document en objet et supprimer explicitement
   * toute donnée sensible avant de la retourner au contrôleur.
   */
  const safeApplication = application.toObject();
  delete safeApplication.clientSecretHash;

  return {
    application: safeApplication,
    credentials: {
      clientId,
      clientSecret,
    },
  };
};

export const getApplications = async ({
  page = 1,
  limit = 20,
  search,
  organization,
  status,
  clientType,
}) => {
  page = Math.max(Number(page) || 1, 1);
  limit = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const filter = {};

  if (search) {
    filter.$or = [
      {
        code: {
          $regex: search,
          $options: "i",
        },
      },
      {
        name: {
          $regex: search,
          $options: "i",
        },
      },
      {
        clientId: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  if (organization) {
    filter.organization = organization;
  }

  if (status) {
    filter.status = status.toUpperCase();
  }

  if (clientType) {
    filter.clientType = clientType.toUpperCase();
  }

  const skip = (page - 1) * limit;

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate("organization", "code name shortName type status")
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Application.countDocuments(filter),
  ]);

  return {
    applications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getApplicationById = async (id) => {
  const application = await Application.findById(id)
    .populate("organization", "code name shortName type status")
    .lean();

  if (!application) {
    const error = new Error("Application introuvable");
    error.statusCode = 404;
    throw error;
  }

  return application;
};

export const getApplicationByClientId = async (clientId) => {
  const application = await Application.findOne({
    clientId,
  })
    .populate("organization", "code name shortName type status")
    .lean();

  if (!application) {
    const error = new Error("Application introuvable");
    error.statusCode = 404;
    throw error;
  }

  return application;
};

export const deactivateApplication = async (id) => {
  const application = await Application.findById(id);

  if (!application) {
    const error = new Error("Application introuvable");
    error.statusCode = 404;
    throw error;
  }

  application.status = "INACTIVE";

  await application.save();

  return application;
};
