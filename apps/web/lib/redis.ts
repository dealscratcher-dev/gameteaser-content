// apps/web/lib/redis.ts
// ─────────────────────────────────────────────────────────────────────────────
// Simple Redis wrapper for caching in the Next.js app.
// Uses ioredis – a lightweight, promise‑based client.
// The client is created once per server runtime (singleton) and reused.
// Environment:
//   REDIS_URL – e.g. redis://:password@host:6379/0
// Functions:
//   get<T>(key: string): Promise<T | null>
//   set<T>(key: string, value: T, ttlSec: number): Promise<void>
//   invalidate(key: string): Promise<void>
//   // Optional: flushAll() for dev/debug.

import Redis from "ioredis";
import { env } from "./env";

let client: Redis | null = null;

function getClient(): Redis {
  if (!client) {
    const url = env.REDIS_URL ?? "redis://localhost:6379";
    client = new Redis(url);
    client.on("error", (err) => {
      console.error("[Redis] connection error:", err);
    });
  }
  return client;
}

/** Get a typed value from Redis. */
export async function get<T>(key: string): Promise<T | null> {
  try {
    const raw = await getClient().get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`[Redis] get failed for ${key}:`, e);
    return null;
  }
}

/** Set a value with a TTL (in seconds). */
export async function set<T>(key: string, value: T, ttlSec: number): Promise<void> {
  try {
    const payload = JSON.stringify(value);
    await getClient().set(key, payload, "EX", ttlSec);
  } catch (e) {
    console.warn(`[Redis] set failed for ${key}:`, e);
  }
}

/** Invalidate a cached key. */
// /** Invalidate a cached key. */
export async function invalidate(key: string): Promise<void> {
  try {
    await getClient().del(key);
  } catch (e) {
    console.warn(`[Redis] invalidate failed for ${key}:`, e);
  }
}

/**
 * Cached fetch wrapper.
 * Retrieves data from Redis if present; otherwise runs fetchFn,
 * stores the result for `ttl` seconds, and returns it.
 */
export async function cachedFetch<T>(key: string, fetchFn: () => Promise<T>, ttl = 60): Promise<T> {
  // Try cache first
  const cached = await get<T>(key);
  if (cached !== null) return cached;

  // Cache miss – fetch fresh data
  const fresh = await fetchFn();
  await set<T>(key, fresh, ttl);
  return fresh;
}

// Optional helper for development – clears everything.
export async function flushAll(): Promise<void> {
  try {
    await getClient().flushall();
  } catch (e) {
    console.warn(`[Redis] flushAll failed:`, e);
  }
}

/** Health-check ping. */
export async function ping(): Promise<boolean> {
  try {
    const result = await getClient().ping();
    return result === "PONG";
  } catch {
    return false;
  }
}

/** Find keys matching a glob pattern. */
export async function keys(pattern: string): Promise<string[]> {
  try {
    return await getClient().keys(pattern);
  } catch (e) {
    console.warn(`[Redis] keys failed for ${pattern}:`, e);
    return [];
  }
}

/** Delete one or more keys. */
export async function del(...keyList: string[]): Promise<void> {
  if (keyList.length === 0) return;
  try {
    await getClient().del(...keyList);
  } catch (e) {
    console.warn(`[Redis] del failed:`, e);
  }
}

/** Get all fields from a hash. */
export async function hgetall(key: string): Promise<Record<string, string>> {
  try {
    const result = await getClient().hgetall(key);
    return (result ?? {}) as Record<string, string>;
  } catch (e) {
    console.warn(`[Redis] hgetall failed for ${key}:`, e);
    return {};
  }
}

/** Increment a hash field. */
export async function hincrby(key: string, field: string, increment: number): Promise<void> {
  try {
    await getClient().hincrby(key, field, increment);
  } catch (e) {
    console.warn(`[Redis] hincrby failed for ${key}:`, e);
  }
}

/** Add members to a HyperLogLog set. */
export async function pfadd(key: string, ...members: string[]): Promise<void> {
  if (members.length === 0) return;
  try {
    await getClient().pfadd(key, ...members);
  } catch (e) {
    console.warn(`[Redis] pfadd failed for ${key}:`, e);
  }
}
