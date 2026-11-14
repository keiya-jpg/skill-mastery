/**
 * In-memory guard per provider: a sliding one-minute window plus a cool-down
 * after a 429. Serverless instances are short-lived, so this is best effort;
 * the provider's own 429s are the real limit and the router falls back on them.
 */
export class ProviderLimiter {
  private hits = new Map<string, number[]>();
  private coolUntil = new Map<string, number>();

  constructor(private now: () => number = Date.now) {}

  /** True if we may send a request to this provider right now (and records it). */
  tryAcquire(id: string, rpm: number): boolean {
    const t = this.now();
    if ((this.coolUntil.get(id) ?? 0) > t) return false;
    const recent = (this.hits.get(id) ?? []).filter((x) => t - x < 60_000);
    if (recent.length >= rpm) {
      this.hits.set(id, recent);
      return false;
    }
    recent.push(t);
    this.hits.set(id, recent);
    return true;
  }

  coolDown(id: string, ms: number) {
    this.coolUntil.set(id, Math.max(this.coolUntil.get(id) ?? 0, this.now() + ms));
  }

  /** Milliseconds until this provider is usable again (0 if it is). */
  waitTime(id: string): number {
    return Math.max(0, (this.coolUntil.get(id) ?? 0) - this.now());
  }
}
