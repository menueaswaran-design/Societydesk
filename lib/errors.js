/**
 * Transport-agnostic application errors.
 *
 * Deliberately free of any Next.js import so the billing/permission logic can
 * also run from plain Node scripts (prisma/seed.js) and tests.
 * lib/api.js re-exports these for route handlers.
 */

export class ApiError extends Error {
  constructor(message, status = 400, code = "BAD_REQUEST", details = undefined) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (msg, details) => new ApiError(msg, 400, "BAD_REQUEST", details);
export const unauthorized = (msg = "Authentication required") =>
  new ApiError(msg, 401, "UNAUTHORIZED");
export const forbidden = (msg = "You are not allowed to do that") =>
  new ApiError(msg, 403, "FORBIDDEN");
export const notFound = (what = "Resource") => new ApiError(`${what} not found`, 404, "NOT_FOUND");
export const conflict = (msg) => new ApiError(msg, 409, "CONFLICT");
export const unprocessable = (msg, details) => new ApiError(msg, 422, "VALIDATION_ERROR", details);