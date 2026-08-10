const AppError = require('../utils/appError');
const { HTTP_STATUS, ERROR_CODES } = require('../constants/httpCodes');

const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;

    return next();
  } catch (error) {
    if (error.errors) {
      const details = error.errors.map((err) => ({
        field: err.path.join('.').replace(/^(body|query|params)\./, ''),
        message: err.message,
      }));

      return next(
        new AppError(
          'Certains champs transmis sont invalides ou manquants.',
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR,
          details
        )
      );
    }
    return next(error);
  }
};

module.exports = validate;
