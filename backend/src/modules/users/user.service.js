import bcrypt from "bcryptjs";

import User from "./user.model.js";
import Organization from "../organizations/organization.model.js";

export const createUser = async (data) => {
  const matricule = data.matricule?.trim().toUpperCase();

  if (!matricule) {
    const error = new Error("Le matricule est obligatoire");
    error.statusCode = 400;
    throw error;
  }

  if (!data.firstName?.trim()) {
    const error = new Error("Le prénom est obligatoire");
    error.statusCode = 400;
    throw error;
  }

  if (!data.lastName?.trim()) {
    const error = new Error("Le nom est obligatoire");
    error.statusCode = 400;
    throw error;
  }

  if (!data.organization) {
    const error = new Error("L'organisation est obligatoire");
    error.statusCode = 400;
    throw error;
  }

  if (!data.password) {
    const error = new Error("Le mot de passe est obligatoire");
    error.statusCode = 400;
    throw error;
  }

  if (data.password.length < 8) {
    const error = new Error(
      "Le mot de passe doit contenir au moins 8 caractères",
    );
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await User.findOne({ matricule });

  if (existingUser) {
    const error = new Error(
      `Un utilisateur avec le matricule ${matricule} existe déjà`,
    );
    error.statusCode = 409;
    throw error;
  }

  const organization = await Organization.findById(data.organization);

  if (!organization) {
    const error = new Error("Organisation introuvable");
    error.statusCode = 400;
    throw error;
  }

  if (organization.status !== "ACTIVE") {
    const error = new Error("L'organisation de l'utilisateur n'est pas active");
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await User.create({
    matricule,
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    email: data.email?.trim().toLowerCase() || null,
    phone: data.phone?.trim() || null,
    organization: organization._id,
    passwordHash,
    roles: data.roles || ["USER"],
    status: "ACTIVE",
    passwordChangedAt: new Date(),
  });

  return user;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getUsers = async ({
  page = 1,
  limit = 20,
  search,
  organization,
  status,
  role,
}) => {
  page = Math.max(Number(page) || 1, 1);
  limit = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const filter = {};

  if (typeof search === "string" && search.trim()) {
    search = escapeRegex(search.trim().slice(0, 100));
    filter.$or = [
      {
        matricule: {
          $regex: search,
          $options: "i",
        },
      },
      {
        firstName: {
          $regex: search,
          $options: "i",
        },
      },
      {
        lastName: {
          $regex: search,
          $options: "i",
        },
      },
      {
        email: {
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

  if (role) {
    filter.roles = role.toUpperCase();
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter)
      .populate("organization", "code name shortName type status")
      .sort({
        lastName: 1,
        firstName: 1,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getUserById = async (id) => {
  const user = await User.findById(id)
    .populate("organization", "code name shortName type status")
    .lean();

  if (!user) {
    const error = new Error("Utilisateur introuvable");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

export const getUserByMatricule = async (matricule) => {
  const user = await User.findOne({
    matricule: matricule.trim().toUpperCase(),
  })
    .populate("organization", "code name shortName type status")
    .lean();

  if (!user) {
    const error = new Error("Utilisateur introuvable");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

export const updateUser = async (id, data) => {
  const user = await User.findById(id);

  if (!user) {
    const error = new Error("Utilisateur introuvable");
    error.statusCode = 404;
    throw error;
  }

  if (data.organization) {
    const organization = await Organization.findById(data.organization);

    if (!organization) {
      const error = new Error("Organisation introuvable");
      error.statusCode = 400;
      throw error;
    }

    if (organization.status !== "ACTIVE") {
      const error = new Error("L'organisation sélectionnée n'est pas active");
      error.statusCode = 400;
      throw error;
    }
  }

  const allowedFields = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "organization",
    "roles",
    "status",
  ];

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      user[field] = data[field];
    }
  });

  await user.save();

  return user;
};

export const deactivateUser = async (id) => {
  const user = await User.findById(id);

  if (!user) {
    const error = new Error("Utilisateur introuvable");
    error.statusCode = 404;
    throw error;
  }

  user.status = "DISABLED";

  await user.save();

  return user;
};
