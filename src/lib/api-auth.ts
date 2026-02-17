import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * Generate a secure API key with prefix "bqa_"
 */
export function generateApiKey(): string {
  const randomPart = randomBytes(24).toString("hex");
  return `bqa_${randomPart}`;
}

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * Validate API key and return the associated agent
 */
export async function validateAgentApiKey(request: NextRequest) {
  const token = extractBearerToken(request);
  if (!token) {
    return null;
  }

  const agent = await prisma.agent.findUnique({
    where: { api_key: token },
  });

  return agent;
}

/**
 * Validate master API key from the api_keys table
 */
export async function validateMasterApiKey(request: NextRequest) {
  const token = extractBearerToken(request);
  if (!token) {
    return null;
  }

  const apiKey = await prisma.apiKey.findUnique({
    where: { key: token, is_active: true },
    include: { created_by: true },
  });

  if (apiKey) {
    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { last_used: new Date() },
    });
  }

  return apiKey;
}

/**
 * Validate either agent API key or master API key
 */
export async function validateAnyApiKey(request: NextRequest) {
  // Try agent key first
  const agent = await validateAgentApiKey(request);
  if (agent) {
    return { type: "agent" as const, agent, apiKey: null };
  }

  // Try master key
  const apiKey = await validateMasterApiKey(request);
  if (apiKey) {
    return { type: "master" as const, agent: null, apiKey };
  }

  return null;
}

/**
 * Get the current session user
 */
export async function getSessionUser() {
  const session = await auth();
  return session?.user || null;
}

/**
 * Check if current session user is an admin
 */
export async function isAdminSession() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

/**
 * Mask an API key for display (show first 4 and last 4 characters)
 */
export function maskApiKey(key: string): string {
  if (key.length <= 12) {
    return "****";
  }
  const prefix = key.slice(0, 8);
  const suffix = key.slice(-4);
  return `${prefix}****${suffix}`;
}

/**
 * Get client IP address from request headers
 */
export function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return null;
}
