import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { AiError, aiErrorMessage } from "@/lib/ai/router-exports";
import { aiConfigured } from "./ai";
import { buildStage, resolveSkill, UserFacingError } from "./skills";
import { anonClient, catalogWriter, userClient } from "./supabase";

/**
 * Server API. Clients call it with `Authorization: Bearer <supabase access token>`.
 * Only things that need a secret (AI keys, writing the shared catalog) live here;
 * everything else goes straight from the client to Supabase under RLS.
 */
type Vars = { userId: string; db: SupabaseClient };

export const api = new Hono<{ Variables: Vars }>().basePath("/api");

api.onError((err, c) => {
  if (err instanceof HTTPException) return c.json({ error: err.message }, err.status);
  if (err instanceof UserFacingError) return c.json({ error: err.message }, err.status);
  if (err instanceof AiError) {
    console.error("[ai]", err.kind, err.message);
    const status = err.kind === "budget" ? 429 : 503;
    return c.json({ error: aiErrorMessage(err), kind: err.kind, retryAfterMs: err.retryAfterMs }, status);
  }
  console.error("[api]", err);
  return c.json({ error: "Something went wrong on our side." }, 500);
});

api.get("/health", async (c) => {
  const time = new Date().toISOString();
  const info = { ok: true, time, ai: aiConfigured(), catalog: Boolean(catalogWriter()) };
  if (c.req.query("db") !== "1") return c.json(info);
  const { data, error } = await anonClient().rpc("ping");
  if (error || data !== "pong") return c.json({ ...info, ok: false, db: "unreachable" }, 503);
  return c.json({ ...info, db: "ok" });
});

api.use("/v1/*", async (c, next) => {
  const header = c.req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new HTTPException(401, { message: "Please log in." });
  const { data, error } = await anonClient().auth.getUser(token);
  if (error || !data.user) throw new HTTPException(401, { message: "Your session has expired. Please log in again." });
  c.set("userId", data.user.id);
  c.set("db", userClient(token));
  await next();
});

api.post("/v1/skills/resolve", async (c) => {
  const body = z.object({ query: z.string().min(1).max(200) }).safeParse(await c.req.json().catch(() => null));
  if (!body.success) throw new HTTPException(400, { message: "Type a skill to learn." });
  return c.json(await resolveSkill(c.get("db"), c.get("userId"), body.data.query));
});

api.post("/v1/skills/:slug/stages/:index", async (c) => {
  const slug = c.req.param("slug");
  const index = Number(c.req.param("index"));
  if (!/^[a-z0-9-]{1,60}$/.test(slug) || !Number.isInteger(index) || index < 0 || index > 7) throw new HTTPException(400, { message: "Bad request." });
  const out = await buildStage(c.get("db"), slug, index);
  return c.json(out, out.status === "building" ? 202 : 200);
});
