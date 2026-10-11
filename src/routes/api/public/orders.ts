import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// نقطة استقبال طلبات تطبيق سطح المكتب: نفس قواعد الموقع —
// إنشاء طلب جديد أو تحديث طلب يملك رمز وصوله فقط، وجلب الطلبات برموزها.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const payload = z.record(z.string(), z.unknown());
const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("push"),
    order: payload,
    notifs: z.array(payload).max(200).default([]),
  }),
  z.object({
    action: z.literal("pull"),
    items: z
      .array(z.object({ id: z.string().max(120), token: z.string().min(8).max(200) }))
      .max(100)
      .default([]),
  }),
]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

export const Route = createFileRoute("/api/public/orders")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const raw = await request.text();
        if (raw.length > 2_000_000) return json({ ok: false, error: "too_large" }, 413);
        let parsed;
        try {
          parsed = schema.safeParse(JSON.parse(raw));
        } catch {
          return json({ ok: false, error: "bad_json" }, 400);
        }
        if (!parsed.success) return json({ ok: false, error: "invalid" }, 400);
        const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
        const now = new Date().toISOString();
        const data = parsed.data;

        if (data.action === "push") {
          const order = data.order;
          const id = String(order["id"] ?? "");
          const token = String(order["accessToken"] ?? "");
          if (!id || token.length < 8) return json({ ok: false, error: "missing_fields" }, 400);
          const existing = await db.from("orders").select("payload").eq("id", id).maybeSingle();
          if (existing.error) return json({ ok: false, error: "db" }, 500);
          if (existing.data) {
            const stored = String((existing.data.payload as Record<string, unknown>)?.["accessToken"] ?? "");
            if (!stored || stored !== token) return json({ ok: false, error: "forbidden" }, 403);
          }
          const up = await db.from("orders").upsert({ id, payload: order as never, updated_at: now });
          if (up.error) return json({ ok: false, error: "db" }, 500);
          const own = data.notifs.filter((n) => String(n["orderId"] ?? "") === id && n["id"]);
          if (own.length) {
            const res = await db
              .from("notifications")
              .upsert(own.map((n) => ({ id: String(n["id"]), payload: n as never, updated_at: now })));
            if (res.error) return json({ ok: false, error: "db" }, 500);
          }
          return json({ ok: true });
        }

        const items = data.items;
        if (!items.length) return json({ orders: [], notifs: [] });
        const res = await db.from("orders").select("id, payload").in("id", items.map((i) => i.id));
        if (res.error) return json({ orders: [], notifs: [] }, 500);
        const tokens = new Map(items.map((i) => [i.id, i.token]));
        const orders = (res.data ?? [])
          .filter((r) => String((r.payload as Record<string, unknown>)?.["accessToken"] ?? "") === tokens.get(r.id))
          .map((r) => r.payload as Record<string, unknown>);
        if (!orders.length) return json({ orders: [], notifs: [] });
        const ids = orders.map((o) => String(o["id"]));
        const nres = await db.from("notifications").select("payload").in("payload->>orderId", ids).limit(2000);
        return json({ orders, notifs: (nres.data ?? []).map((r) => r.payload) });
      },
    },
  },
});
