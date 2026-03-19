import { Hono } from "hono";
import { Mppx, tempo } from "mppx/hono";
import { createAdSchema, topupAmountSchema, type AppContext, type AdStatsRow } from "./types";

const app = new Hono<AppContext>();

app.get("/health", (c) => c.json({ status: "ok" }));

app.post(
  "/ad",
  async (c, next) => {
    const mppx = Mppx.create({
      methods: [
        tempo({
          currency: c.env.PAYMENT_CURRENCY as `0x${string}`,
          recipient: c.env.PAY_TO as `0x${string}`,
          testnet: c.env.TEMPO_TESTNET,
        }),
      ],
      secretKey: c.env.MPP_SECRET_KEY,
    });

    return mppx.charge({
      amount: "0.01",
      description: "Post an ad on AgentAds",
    })(c, next);
  },
  async (c) => {
    const formData = await c.req.formData();
    const markdownFile = formData.get("markdown");
    const creatorAddress = formData.get("creator_address");

    let markdownContent: string;
    if (typeof markdownFile === "string") {
      markdownContent = markdownFile;
    } else if (markdownFile && typeof markdownFile === "object" && "text" in markdownFile) {
      markdownContent = await (markdownFile as Blob).text();
    } else {
      return c.json({ error: "markdown file is required" }, 400);
    }

    const parsed = createAdSchema.safeParse({
      markdown: markdownContent,
      creator_address: creatorAddress,
    });
    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }

    const { markdown, creator_address } = parsed.data;
    const adId = crypto.randomUUID();

    await c.env.AD_BUCKET.put(`ads/${adId}.md`, markdown, {
      httpMetadata: { contentType: "text/markdown" },
      customMetadata: { creatorAddress: creator_address, adId },
    });

    await c.env.DB.prepare(
      "INSERT INTO ads (ad_id, creator_address) VALUES (?, ?)"
    )
      .bind(adId, creator_address)
      .run();

    return c.json({ ad_id: adId }, 201);
  }
);

app.get("/stats/:id", async (c) => {
  const adId = c.req.param("id");
  const row = await c.env.DB.prepare(
    "SELECT ad_id, balance_cents, impressions FROM ads WHERE ad_id = ?"
  ).bind(adId).first<AdStatsRow>();

  if (!row) return c.json({ error: "Ad not found" }, 404);

  const COST_PER_IMPRESSION_CENTS = 10;
  return c.json({
    ad_id: row.ad_id,
    balance_cents: row.balance_cents,
    impressions: row.impressions,
    amount_spent_cents: row.impressions * COST_PER_IMPRESSION_CENTS,
  });
});

app.post(
  "/topup/:id",
  async (c, next) => {
    const adId = c.req.param("id");
    const amountStr = c.req.query("amount");
    if (!amountStr) return c.json({ error: "Missing required query parameter: amount" }, 400);

    const parsed = topupAmountSchema.safeParse(amountStr);
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

    // Verify ad exists before accepting payment
    const ad = await c.env.DB.prepare("SELECT ad_id FROM ads WHERE ad_id = ?")
      .bind(adId).first();
    if (!ad) return c.json({ error: "Ad not found" }, 404);

    const mppx = Mppx.create({
      methods: [tempo({
        currency: c.env.PAYMENT_CURRENCY as `0x${string}`,
        recipient: c.env.PAY_TO as `0x${string}`,
        testnet: c.env.TEMPO_TESTNET,
      })],
      secretKey: c.env.MPP_SECRET_KEY,
    });

    return mppx.charge({
      amount: parsed.data,
      description: `Top up ad ${adId}`,
    })(c, next);
  },
  async (c) => {
    const adId = c.req.param("id");
    const amountStr = c.req.query("amount")!;
    const balanceIncrementCents = Math.round(parseFloat(amountStr) * 100);

    await c.env.DB.prepare(
      "UPDATE ads SET balance_cents = balance_cents + ? WHERE ad_id = ?"
    ).bind(balanceIncrementCents, adId).run();

    const ad = await c.env.DB.prepare(
      "SELECT balance_cents FROM ads WHERE ad_id = ?"
    ).bind(adId).first<{ balance_cents: number }>();

    return c.json({
      ad_id: adId,
      topped_up_cents: balanceIncrementCents,
      balance_cents: ad!.balance_cents,
    });
  }
);

export default app;
