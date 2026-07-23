export type BoundedIdCacheOptions = {
  maxEntries?: number;
  ttlMs?: number;
  now?: () => number;
};

/**
 * A small insertion-ordered cache for overlay event IDs.
 *
 * Entries expire by age and the oldest entry is evicted when capacity is
 * reached, preventing long-running OBS sessions from accumulating an
 * unbounded deduplication set.
 */
export class BoundedIdCache {
  private readonly entries = new Map<string, number>();
  private readonly maxEntries: number;
  private readonly ttlMs: number;
  private readonly now: () => number;

  constructor(options: BoundedIdCacheOptions = {}) {
    this.maxEntries = Math.max(1, Math.floor(options.maxEntries ?? 256));
    this.ttlMs = Math.max(1, Math.floor(options.ttlMs ?? 30 * 60_000));
    this.now = options.now ?? Date.now;
  }

  get size() {
    this.prune();
    return this.entries.size;
  }

  has(id: string) {
    this.prune();
    return this.entries.has(id);
  }

  add(id: string) {
    this.prune();
    if (this.entries.has(id)) return false;

    while (this.entries.size >= this.maxEntries) {
      const oldest = this.entries.keys().next().value as string | undefined;
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }

    this.entries.set(id, this.now());
    return true;
  }

  clear() {
    this.entries.clear();
  }

  private prune() {
    const cutoff = this.now() - this.ttlMs;
    for (const [id, addedAt] of this.entries) {
      if (addedAt > cutoff) break;
      this.entries.delete(id);
    }
  }
}
