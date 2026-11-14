import type { LogEntry, Store } from "@/lib/store";

export interface ActivityResult {
  attempts?: number;
  successes?: number;
  /** 0..1 */
  score?: number;
  level?: number;
  data?: Record<string, unknown>;
}

export interface ActivityCtx {
  slug: string;
  stageId: string;
  store: Store;
  /** This activity's earlier results, newest first. */
  history: LogEntry[];
}

export interface ActivityProps<A> {
  activity: A;
  ctx: ActivityCtx;
  onDone: (r: ActivityResult) => void;
}
