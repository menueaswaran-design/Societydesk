import { NextResponse } from "next/server";
import { ApiError, badRequest, conflict, forbidden, notFound, unauthorized } from "./errors.js";

export { ApiError, badRequest, conflict, forbidden, notFound, unauthorized };

/**
 * Wrap a payload in the standard success envelope.
 * Pass `{ meta, status }` to add pagination info / an HTTP status.
 */
export function ok(data, init = {}) {
  const { meta, ...responseInit } = init;
  const body = meta === undefined ? { success: true, data } : { success: true, data, meta };
  return NextResponse.json(body, responseInit);
}

/** Standard error envelope. Never leak stack traces to the client. */
export function fail(message, status = 400, code = "BAD_REQUEST", details = undefined) {
  return NextResponse.json(
    { success: false, error: { message, code, ...(details ? { details } : {}) } },
    { status }
  );
}

/**
 * Run a route handler body and translate thrown ApiError / ZodError / Prisma
 * errors into the standard envelope, so route files stay free of try/catch noise.
 *
 * Arguments from the route handler signature (request, context) are forwarded
 * to the wrapped body untouched.
 */
export function handler(fn) {
  return async function routeHandler(...args) {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ApiError) {
        return fail(err.message, err.status, err.code, err.details);
      }
      if (err?.name === "ZodError") {
        return fail("Validation failed", 422, "VALIDATION_ERROR", flattenZod(err));
      }
      if (err?.code === "P2002") {
        return fail("A record with these values already exists", 409, "CONFLICT");
      }
      if (err?.code === "P2025") {
        return fail("Record not found", 404, "NOT_FOUND");
      }
      if (err?.code === "P2023") {
        return fail("Referenced record does not exist", 400, "BAD_REFERENCE");
      }
      console.error("[api] unhandled error:", err);
      return fail("Something went wrong on our side", 500, "INTERNAL_ERROR");
    }
  };
}

function flattenZod(err) {
  const out = {};
  for (const issue of err?.issues ?? []) {
    const key = issue.path?.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Read a JSON body without throwing on empty bodies. */
export async function readJson(req) {
  try {
    const text = await req.text();
    if (!text) return {};
    return JSON.parse(text);
  } catch {
    throw badRequest("Request body must be valid JSON");
  }
}

/** Standard { data, meta } page envelope. */
export function page(data, meta) {
  return { data, meta };
}