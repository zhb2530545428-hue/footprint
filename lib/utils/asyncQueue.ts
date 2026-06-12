/**
 * Lightweight concurrency helper for bounded async operations.
 *
 * Used to limit simultaneous file copy / thumbnail generation
 * so that importing many photos does not spawn 30 parallel tasks.
 */

/**
 * Map over `items` with at most `limit` concurrent `worker` invocations.
 * Results preserve the original item order.
 * Worker errors propagate to the caller.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];

  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function runNext(): Promise<void> {
    while (nextIndex < items.length) {
      const i = nextIndex++;
      results[i] = await worker(items[i], i);
    }
  }

  const concurrency = Math.min(limit, items.length);
  const workers = Array.from({ length: concurrency }, () => runNext());
  await Promise.all(workers);

  return results;
}
