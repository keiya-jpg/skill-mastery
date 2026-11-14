import { handle } from "hono/vercel";
import { api } from "@/lib/server/api";

export const runtime = "nodejs";
// Each AI step is one provider call; 60 s is within Vercel Hobby limits.
export const maxDuration = 60;

export const GET = handle(api);
export const POST = handle(api);
export const PUT = handle(api);
export const PATCH = handle(api);
export const DELETE = handle(api);
