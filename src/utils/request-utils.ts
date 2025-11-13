/**
 * Request utility functions
 */

import { Request } from 'express';

/**
 * Extract the real IP address from a request
 * Handles proxies, load balancers, and direct connections
 */
export function getUserIp(req: Request): string | undefined {
  // Check standard forwarding headers (in order of preference)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, get the first (original client)
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return ips.split(',')[0].trim();
  }

  // Check for Cloudflare's connecting IP
  const cfConnectingIp = req.headers['cf-connecting-ip'];
  if (cfConnectingIp) {
    return Array.isArray(cfConnectingIp) ? cfConnectingIp[0] : cfConnectingIp;
  }

  // Check for real IP header (used by some proxies)
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Fallback to connection remote address
  return req.socket.remoteAddress;
}
