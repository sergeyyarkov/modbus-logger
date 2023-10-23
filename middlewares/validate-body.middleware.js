/**
 * Validate request body
 * @param {import('yup').Schema} schema
 */
export function validateBodyMiddleware(schema) {
  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  return async (req, res, next) => {
    try {
      await schema.validate(req.body);
      next();
    } catch (error) {
      return res.status(400).send(error.message);
    }
  };
}
