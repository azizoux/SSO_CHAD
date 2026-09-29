import Organization from "./organization.model.js";

/**
 * Créer une organisation.
 */
export const createOrganization = async (data) => {
  const code = data.code?.trim().toUpperCase();

  if (!code) {
    const error = new Error("Le code de l'organisation est obligatoire");
    error.statusCode = 400;
    throw error;
  }

  const existingOrganization = await Organization.findOne({ code });

  if (existingOrganization) {
    const error = new Error(
      `Une organisation avec le code ${code} existe déjà`,
    );
    error.statusCode = 409;
    throw error;
  }

  if (data.parentOrganization) {
    const parent = await Organization.findById(data.parentOrganization);

    if (!parent) {
      const error = new Error("Organisation parente introuvable");
      error.statusCode = 400;
      throw error;
    }
  }

  const organization = await Organization.create({
    ...data,
    code,
  });

  return organization;
};

/**
 * Liste des organisations.
 */
export const getOrganizations = async ({
  page = 1,
  limit = 20,
  search,
  type,
  status,
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
        shortName: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  if (type) {
    filter.type = type.toUpperCase();
  }

  if (status) {
    filter.status = status.toUpperCase();
  }

  const skip = (page - 1) * limit;

  const [organizations, total] = await Promise.all([
    Organization.find(filter)
      .populate("parentOrganization", "code name shortName type status")
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Organization.countDocuments(filter),
  ]);

  return {
    organizations,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Récupérer une organisation par ID.
 */
export const getOrganizationById = async (id) => {
  const organization = await Organization.findById(id)
    .populate("parentOrganization", "code name shortName type status")
    .lean();

  if (!organization) {
    const error = new Error("Organisation introuvable");
    error.statusCode = 404;
    throw error;
  }

  return organization;
};

/**
 * Récupérer une organisation par son code.
 */
export const getOrganizationByCode = async (code) => {
  const organization = await Organization.findOne({
    code: code.toUpperCase(),
  })
    .populate("parentOrganization", "code name shortName type status")
    .lean();

  if (!organization) {
    const error = new Error("Organisation introuvable");
    error.statusCode = 404;
    throw error;
  }

  return organization;
};

/**
 * Modifier une organisation.
 */
export const updateOrganization = async (id, data) => {
  const organization = await Organization.findById(id);

  if (!organization) {
    const error = new Error("Organisation introuvable");
    error.statusCode = 404;
    throw error;
  }

  if (data.code) {
    const code = data.code.trim().toUpperCase();

    const duplicate = await Organization.findOne({
      code,
      _id: { $ne: id },
    });

    if (duplicate) {
      const error = new Error(
        `Une organisation avec le code ${code} existe déjà`,
      );
      error.statusCode = 409;
      throw error;
    }

    data.code = code;
  }

  if (data.parentOrganization !== undefined) {
    if (
      data.parentOrganization &&
      data.parentOrganization.toString() === id.toString()
    ) {
      const error = new Error(
        "Une organisation ne peut pas être sa propre organisation parente",
      );
      error.statusCode = 400;
      throw error;
    }

    if (data.parentOrganization) {
      const parent = await Organization.findById(data.parentOrganization);

      if (!parent) {
        const error = new Error("Organisation parente introuvable");
        error.statusCode = 400;
        throw error;
      }
    }
  }

  const allowedFields = [
    "code",
    "name",
    "shortName",
    "type",
    "parentOrganization",
    "description",
    "status",
  ];

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      organization[field] = data[field];
    }
  });

  await organization.save();

  return organization;
};

/**
 * Désactiver une organisation.
 *
 * On privilégie la désactivation plutôt que la suppression physique.
 */
export const deactivateOrganization = async (id) => {
  const organization = await Organization.findById(id);

  if (!organization) {
    const error = new Error("Organisation introuvable");
    error.statusCode = 404;
    throw error;
  }

  organization.status = "INACTIVE";

  await organization.save();

  return organization;
};
