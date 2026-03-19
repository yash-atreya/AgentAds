import { Hono } from "hono";
import { Mppx, tempo } from "mppx/hono";
import { verifyMessage, createWalletClient, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { tempo as tempoChain } from "viem/chains";
import {
  createAdSchema,
  topupAmountSchema,
  serveRequestSchema,
  viewedRequestSchema,
  withdrawRequestSchema,
  type AppContext,
  type AdStatsRow,
  type ViewerRow,
} from "./types";

async function md5Hex(data: string): Promise<string> {
  const buffer = await crypto.subtle.digest("MD5", new TextEncoder().encode(data));
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

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
      amount: "0.10",
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

app.get("/ad/:id", async (c) => {
  const adId = c.req.param("id");
  const obj = await c.env.AD_BUCKET.get(`ads/${adId}.md`);
  if (!obj) return c.json({ error: "Ad not found" }, 404);
  const markdown = await obj.text();
  return new Response(markdown, {
    status: 200,
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
});

app.get("/stats/:id", async (c) => {
  const adId = c.req.param("id");
  const row = await c.env.DB.prepare(
    "SELECT ad_id, balance_cents, impressions FROM ads WHERE ad_id = ?"
  ).bind(adId).first<AdStatsRow>();

  if (!row) return c.json({ error: "Ad not found" }, 404);

  const COST_PER_IMPRESSION_CENTS = 10;
  return c.json({
    ad_id: row.ad_id,
    balance: row.balance_cents / 100,
    impressions: row.impressions,
    amount_spent: (row.impressions * COST_PER_IMPRESSION_CENTS) / 100,
  });
});

app.post("/serve", async (c) => {
  // 1. Check X-AgentAds-Client header
  const clientHeader = c.req.header("X-AgentAds-Client");
  if (!clientHeader) {
    return c.json({ error: "Missing X-AgentAds-Client header" }, 403);
  }

  // 2. Parse and validate body
  const body = await c.req.json();
  const parsed = serveRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const { viewer_address, signature } = parsed.data;

  // 3. Verify signature
  const message = `AgentAds:${viewer_address}`;
  const valid = await verifyMessage({
    address: viewer_address as `0x${string}`,
    message,
    signature: signature as `0x${string}`,
  });
  if (!valid) {
    return c.json({ error: "Invalid signature" }, 401);
  }

  // 4. Auto-register viewer
  await c.env.DB.prepare(
    "INSERT OR IGNORE INTO viewers (viewer_address) VALUES (?)"
  ).bind(viewer_address).run();

  // 5. Select eligible ad
  const ad = await c.env.DB.prepare(`
    SELECT ad_id FROM ads
    WHERE balance_cents >= 10
      AND ad_id NOT IN (SELECT ad_id FROM views WHERE viewer_address = ?)
    ORDER BY RANDOM() LIMIT 1
  `).bind(viewer_address).first<{ ad_id: string }>();

  if (!ad) {
    return c.body(null, 204);
  }

  // 6. Fetch markdown from R2
  const obj = await c.env.AD_BUCKET.get(`ads/${ad.ad_id}.md`);
  if (!obj) {
    return c.json({ error: "Ad content not found" }, 500);
  }
  const markdown = await obj.text();
  const contentHash = await md5Hex(markdown);

  return c.json({
    ad_id: ad.ad_id,
    markdown,
    content_hash: contentHash,
  });
});

app.post("/viewed", async (c) => {
  // 1. Check X-AgentAds-Client header
  const clientHeader = c.req.header("X-AgentAds-Client");
  if (!clientHeader) {
    return c.json({ error: "Missing X-AgentAds-Client header" }, 403);
  }

  // 2. Parse and validate body
  const body = await c.req.json();
  const parsed = viewedRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const { viewer_address, signature, content_hash, ad_id } = parsed.data;

  // 3. Verify signature over content_hash:viewer_address
  const message = `${content_hash}:${viewer_address}`;
  const valid = await verifyMessage({
    address: viewer_address as `0x${string}`,
    message,
    signature: signature as `0x${string}`,
  });
  if (!valid) {
    return c.json({ error: "Invalid signature" }, 401);
  }

  // 4. Verify ad exists and has balance
  const ad = await c.env.DB.prepare(
    "SELECT ad_id, balance_cents FROM ads WHERE ad_id = ? AND balance_cents >= 10"
  ).bind(ad_id).first<{ ad_id: string; balance_cents: number }>();
  if (!ad) {
    return c.json({ error: "Ad not found or insufficient balance" }, 404);
  }

  // 5. Verify content_hash matches actual ad markdown
  const obj = await c.env.AD_BUCKET.get(`ads/${ad_id}.md`);
  if (!obj) {
    return c.json({ error: "Ad content not found" }, 500);
  }
  const markdown = await obj.text();
  const expectedHash = await md5Hex(markdown);
  if (content_hash.toLowerCase() !== expectedHash.toLowerCase()) {
    return c.json({ error: "Content hash mismatch" }, 400);
  }

  // 6. Auto-register viewer (in case /viewed is called without prior /serve)
  await c.env.DB.prepare(
    "INSERT OR IGNORE INTO viewers (viewer_address) VALUES (?)"
  ).bind(viewer_address).run();

  // 7. Atomic D1 batch — billing
  const impressionId = crypto.randomUUID();
  const results = await c.env.DB.batch([
    c.env.DB.prepare(
      "UPDATE ads SET balance_cents = balance_cents - 10, impressions = impressions + 1 WHERE ad_id = ? AND balance_cents >= 10"
    ).bind(ad_id),
    c.env.DB.prepare(
      "INSERT INTO views (impression_id, ad_id, viewer_address, earned_cents) VALUES (?, ?, ?, 10)"
    ).bind(impressionId, ad_id, viewer_address),
    c.env.DB.prepare(
      "UPDATE viewers SET balance_cents = balance_cents + 10, total_earned_cents = total_earned_cents + 10, impression_count = impression_count + 1 WHERE viewer_address = ?"
    ).bind(viewer_address),
  ]);

  // 8. Verify ads UPDATE changed 1 row
  if (!results[0].meta.changes) {
    return c.json({ error: "Ad no longer available" }, 409);
  }

  // 9. Get updated viewer balance
  const viewer = await c.env.DB.prepare(
    "SELECT balance_cents FROM viewers WHERE viewer_address = ?"
  ).bind(viewer_address).first<{ balance_cents: number }>();

  return c.json({
    ad_id,
    impression_id: impressionId,
    earned: 0.10,
    viewer_balance: (viewer?.balance_cents ?? 0) / 100,
  });
});

app.get("/viewer/:address", async (c) => {
  const address = c.req.param("address");
  const viewer = await c.env.DB.prepare(
    "SELECT * FROM viewers WHERE viewer_address = ?"
  ).bind(address).first<ViewerRow>();

  return c.json({
    viewer_address: address,
    balance: (viewer?.balance_cents ?? 0) / 100,
    total_earned: (viewer?.total_earned_cents ?? 0) / 100,
    total_withdrawn: (viewer?.total_withdrawn_cents ?? 0) / 100,
    impression_count: viewer?.impression_count ?? 0,
  });
});

app.post("/withdraw", async (c) => {
  // 1. Check header
  const clientHeader = c.req.header("X-AgentAds-Client");
  if (!clientHeader) {
    return c.json({ error: "Missing X-AgentAds-Client header" }, 403);
  }

  // 2. Parse body
  const body = await c.req.json();
  const parsed = withdrawRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const { viewer_address, signature } = parsed.data;

  // 3. Verify signature
  const message = `AgentAds:${viewer_address}`;
  const valid = await verifyMessage({
    address: viewer_address as `0x${string}`,
    message,
    signature: signature as `0x${string}`,
  });
  if (!valid) {
    return c.json({ error: "Invalid signature" }, 401);
  }

  // 4. Check balance
  const viewer = await c.env.DB.prepare(
    "SELECT balance_cents FROM viewers WHERE viewer_address = ?"
  ).bind(viewer_address).first<{ balance_cents: number }>();

  if (!viewer || viewer.balance_cents === 0) {
    return c.json({ error: "No balance to withdraw" }, 400);
  }

  const payoutCents = viewer.balance_cents;
  const withdrawalId = crypto.randomUUID();

  // 5. D1 batch: zero balance + insert withdrawal
  await c.env.DB.batch([
    c.env.DB.prepare(
      "UPDATE viewers SET balance_cents = 0, total_withdrawn_cents = total_withdrawn_cents + ? WHERE viewer_address = ?"
    ).bind(payoutCents, viewer_address),
    c.env.DB.prepare(
      "INSERT INTO withdrawals (withdrawal_id, viewer_address, amount_cents, payout_cents, status) VALUES (?, ?, ?, ?, 'pending')"
    ).bind(withdrawalId, viewer_address, payoutCents, payoutCents),
  ]);

  // 6. On-chain USDC transfer
  try {
    const account = privateKeyToAccount(c.env.PAY_TO_PRIVATE_KEY as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: tempoChain,
      transport: http(),
    });

    const usdcAddress = c.env.PAYMENT_CURRENCY as `0x${string}`;
    const payoutUnits = parseUnits((payoutCents / 100).toFixed(2), 6); // USDC has 6 decimals

    const txHash = await walletClient.writeContract({
      address: usdcAddress,
      abi: [{
        name: "transfer",
        type: "function",
        inputs: [
          { name: "to", type: "address" },
          { name: "amount", type: "uint256" },
        ],
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "nonpayable",
      }],
      functionName: "transfer",
      args: [viewer_address as `0x${string}`, payoutUnits],
    });

    // 7. Update withdrawal status
    await c.env.DB.prepare(
      "UPDATE withdrawals SET tx_hash = ?, status = 'confirmed' WHERE withdrawal_id = ?"
    ).bind(txHash, withdrawalId).run();

    return c.json({
      withdrawal_id: withdrawalId,
      payout: payoutCents / 100,
      tx_hash: txHash,
    });
  } catch (err) {
    // Transfer failed — mark as failed
    await c.env.DB.prepare(
      "UPDATE withdrawals SET status = 'failed' WHERE withdrawal_id = ?"
    ).bind(withdrawalId).run();

    return c.json({ error: "On-chain transfer failed", withdrawal_id: withdrawalId }, 500);
  }
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

    const amount = parseFloat(parsed.data);
    const totalWithFee = (amount * 1.01).toFixed(2);

    return mppx.charge({
      amount: totalWithFee,
      description: `Top up ad ${adId} ($${parsed.data} + 1% fee)`,
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

    const feeCents = Math.round(balanceIncrementCents * 0.01);
    return c.json({
      ad_id: adId,
      topped_up: balanceIncrementCents / 100,
      fee: feeCents / 100,
      total_charged: (balanceIncrementCents + feeCents) / 100,
      balance: ad!.balance_cents / 100,
    });
  }
);
export default app;
