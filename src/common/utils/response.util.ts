import { Response } from 'express';

/**
 * Sends a JSON response with proper Content-Length calculation for UTF-8 content.
 * This prevents chunked transfer issues with multi-byte characters (e.g., Cyrillic).
 *
 * @param res - Express Response object
 * @param data - Data to serialize as JSON
 * @param statusCode - HTTP status code (default: 200)
 */
export function sendJsonResponse(res: Response, data: any, statusCode: number = 200) {
  const json = JSON.stringify(data);
  const buffer = Buffer.from(json, 'utf-8');

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Length', buffer.length.toString());
  res.status(statusCode).end(buffer);
}
