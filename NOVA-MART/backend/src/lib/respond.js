/**
 * Thin helpers that keep the API envelope consistent:
 *
 *   success -> { success: true, data, meta? }
 *   failure -> { success: false, message, code, details? } (see errorHandler)
 */

/**
 * @param {import('express').Response} res
 * @param {unknown} data
 * @param {object} [meta]
 */
export function ok(res, data, meta) {
  return res.status(200).json({ success: true, data, ...(meta ? { meta } : {}) });
}

/**
 * @param {import('express').Response} res
 * @param {unknown} data
 * @param {string} [message]
 */
export function created(res, data, message) {
  return res.status(201).json({ success: true, ...(message ? { message } : {}), data });
}

/**
 * @param {import('express').Response} res
 * @param {unknown} data
 * @param {string} message
 */
export function message(res, data, message) {
  return res.status(200).json({ success: true, message, data });
}
