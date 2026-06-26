import { Redis } from "@upstash/redis";

// Upstash Redis over its REST API. Reads UPSTASH_REDIS_REST_URL and
// UPSTASH_REDIS_REST_TOKEN from the environment. Throws at import if they
// are missing — only modules that actually touch the cache import this.
export const redis = Redis.fromEnv();
