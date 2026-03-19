import { Hono } from "hono";
import { Mppx, tempo } from "mppx/hono";
import { createAdSchema, type AppContext } from "./types";

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

export default app;
