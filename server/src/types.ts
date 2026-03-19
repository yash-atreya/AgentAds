import { z } from "zod";

export interface Env {
  AD_BUCKET: R2Bucket;
  DB: D1Database;
  PAY_TO: string;
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
