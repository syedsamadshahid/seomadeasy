import { z } from "zod";

// Normalizes a user-entered domain: lowercases, strips protocol + trailing slash.
export function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
}

const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]*\.)+[a-z]{2,}$/;

// Zod schema that normalizes then validates a bare domain (e.g. "example.com").
export const domainSchema = z
  .string()
  .min(1)
  .transform(normalizeDomain)
  .refine((v) => DOMAIN_RE.test(v), { message: "Invalid domain" });
