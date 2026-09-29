import * as applicationService from "./application.service.js";

export const createApplication = async (req, res, next) => {
  try {
    const result = await applicationService.createApplication(req.body);

    return res.status(201).json({
      success: true,
      message: "Application créée avec succès",
      data: result.application,
      credentials: result.credentials,
      warning:
        result.credentials.clientSecret !== null
          ? "Conservez le clientSecret en lieu sûr. Il ne sera plus affiché."
          : null,
    });
  } catch (error) {
    next(error);
  }
};

export const getApplications = async (req, res, next) => {
  try {
    const result = await applicationService.getApplications({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      organization: req.query.organization,
      status: req.query.status,
      clientType: req.query.clientType,
    });

    return res.status(200).json({
      success: true,
      data: result.applications,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getApplicationById = async (req, res, next) => {
  try {
    const application = await applicationService.getApplicationById(
      req.params.id,
    );

    return res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

export const getApplicationByClientId = async (req, res, next) => {
  try {
    const application = await applicationService.getApplicationByClientId(
      req.params.clientId,
    );

    return res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

export const deactivateApplication = async (req, res, next) => {
  try {
    const application = await applicationService.deactivateApplication(
      req.params.id,
    );

    return res.status(200).json({
      success: true,
      message: "Application désactivée avec succès",
      data: application,
    });
  } catch (error) {
    next(error);
  }
};
