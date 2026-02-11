/**
 * レート制限（Redis版）
 * Upstash Redisを使用した本番環境対応のレート制限
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Upstash Redis クライアント（環境変数が設定されている場合のみ初期化）
let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "1 m"), // 1分間に60リクエスト
    analytics: true,
    prefix: "@upstash/ratelimit",
  });
}

/**
 * インメモリフォールバック（開発環境用）
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimitInMemory(
  identifier: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  if (!record || now > record.resetTime) {
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: now + windowMs,
    };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * レート制限チェック
 * Upstash Redisが設定されていればRedis版、なければインメモリ版を使用
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowMs: number = 60000
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  // Redis版（本番環境）
  if (ratelimit) {
    try {
      const { success, limit: maxLimit, remaining, reset } = await ratelimit.limit(identifier);
      
      return {
        allowed: success,
        remaining,
        resetTime: reset,
      };
    } catch (error) {
      console.error("Redis rate limit error, falling back to in-memory:", error);
      // Redisエラー時はインメモリにフォールバック
      return checkRateLimitInMemory(identifier, limit, windowMs);
    }
  }

  // インメモリ版（開発環境）
  return checkRateLimitInMemory(identifier, limit, windowMs);
}

/**
 * レート制限の状態を確認（カウントしない）
 */
export async function getRateLimitStatus(identifier: string): Promise<{
  remaining: number;
  resetTime: number;
} | null> {
  if (ratelimit && redis) {
    try {
      const key = `@upstash/ratelimit:${identifier}`;
      const count = await redis.get<number>(key);
      const ttl = await redis.ttl(key);
      
      if (count !== null && ttl > 0) {
        return {
          remaining: Math.max(0, 60 - count),
          resetTime: Date.now() + ttl * 1000,
        };
      }
    } catch (error) {
      console.error("Redis status check error:", error);
    }
  }

  // インメモリ版
  const record = requestCounts.get(identifier);
  if (record && Date.now() <= record.resetTime) {
    return {
      remaining: Math.max(0, 60 - record.count),
      resetTime: record.resetTime,
    };
  }

  return null;
}

/**
 * レート制限をリセット（テスト用）
 */
export async function resetRateLimit(identifier: string): Promise<void> {
  if (ratelimit && redis) {
    try {
      const key = `@upstash/ratelimit:${identifier}`;
      await redis.del(key);
    } catch (error) {
      console.error("Redis reset error:", error);
    }
  }

  // インメモリ版
  requestCounts.delete(identifier);
}
