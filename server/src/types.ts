import { z } from "zod";

export interface Env {
  AD_BUCKET: R2Bucket;
  DB: D1Database;
  PAY_TO: string;
  PAY_TO_PRIVATE_KEY: string;
  PAYMENT_CURRENCY: string;
  TEMPO_TESTNET: boolean;
  MPP_SECRET_KEY: string;
}

export interface AppContext {
  Bindings: Env;
}

export const createAdSchema = z.object({
  markdown: z.string().min(1).max(50_000),
  creator_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

export interface AdStatsRow {
  ad_id: string;
  balance_cents: number;
  impressions: number;
}

export const topupAmountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/)
  .refine((v) => {
    const n = parseFloat(v);
    return n >= 0.01 && n <= 10000;
  }, "Amount must be between 0.01 and 10000.00");

export const serveRequestSchema = z.object({
  viewer_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
});

export const viewedRequestSchema = z.object({
  viewer_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
  content_hash: z.string().regex(/^[a-fA-F0-9]{32}$/),
  ad_id: z.string().uuid(),
});

export const withdrawRequestSchema = serveRequestSchema;

export interface ViewerRow {
  viewer_address: string;
  balance_cents: number;
  total_earned_cents: number;
  total_withdrawn_cents: number;
  impression_count: number;
  registered_at: string;
}
