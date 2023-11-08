export function errorHandlerMiddleware() {
  /**
   * @param {any} error
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  return (error, req, res, next) => {
    req.log.error(error, "Something went wrong");
    const status = error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    res.status(status).json({
      error: {
        status,
        message,
        stack: process.env.NODE_ENV === "development" ? error.stack : {},
      },
    });
  };
}
