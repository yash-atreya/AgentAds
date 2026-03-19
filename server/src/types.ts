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
