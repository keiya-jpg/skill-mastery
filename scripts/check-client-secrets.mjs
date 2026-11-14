#!/usr/bin/env node
/**
 * Fails if anything that looks like a secret ended up in the browser bundle.
 * Run after `next build`:  node scripts/check-client-secrets.mjs .next/static
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2] ?? ".next/static";
const patterns = [
  { name: "Supabase secret key", re: /sb_secret_[A-Za-z0-9_-]{10,}/ },
  { name: "Supabase service_role JWT", re: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]*c2VydmljZV9yb2xl[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+/ },
  { name: "Google API key", re: /AIza[0-9A-Za-z_-]{35}/ },
  { name: "Groq API key", re: /gsk_[A-Za-z0-9]{20,}/ },
  { name: "OpenRouter API key", re: /sk-or-v1-[a-f0-9]{20,}/ },
  { name: "Generic secret env name", re: /(GEMINI|GROQ|OPENROUTER|CLOUDFLARE)_API_KEY|SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY/ },
];

const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    statSync(p).isDirectory() ? walk(p) : /\.(js|css|html|json)$/.test(p) && files.push(p);
  }
})(dir);

let bad = 0;
for (const f of files) {
  const text = readFileSync(f, "utf8");
  for (const { name, re } of patterns) {
    if (re.test(text)) {
      console.error(`✖ ${name} found in ${f}`);
      bad++;
    }
  }
}
if (bad) process.exit(1);
console.log(`✓ No secrets found in ${files.length} client files`);
