interface CachedItem<T = any> {
  item: T;
  cachedAt: number;
}

const CACHE_ENABLED = true;

class InMemoryLruCache {
  private CACHE_DURATION = 60_000 * 60; // 1 hour
  private cache = new Map<any, CachedItem>();

  private stats = { hits: 0, misses: 0, expired: 0, evicted: 0, cleared: 0 };

  constructor(private maxSize: number = 10_000) {
    console.log(
      'Cache stats;',
      JSON.stringify({ ...this.stats, size: this.cache.size }, null, 2),
    );
    setInterval(
      () =>
        console.log(
          'Cache stats;',
          JSON.stringify({ ...this.stats, size: this.cache.size }, null, 2),
        ),
      60_000 * 30,
    );
  }

  private get<T>(key: any, duration?: number): T | undefined {
    const DURATION = duration || this.CACHE_DURATION;
    const cachedItem = this.cache.get(key);
    const hasExpired =
      cachedItem && cachedItem.cachedAt < Date.now() - DURATION;

    // Cache hit, and it's not expired
    if (cachedItem && !hasExpired) {
      this.stats.hits++;
      this.cache.delete(key);
      this.cache.set(key, cachedItem);
      return cachedItem?.item as T | undefined;
    }

    // Cache hit, but it's expired.
    if (cachedItem && hasExpired) {
      this.cache.delete(key);
      this.stats.expired++;
    }

    this.stats.misses++;
    return undefined;
  }

  private set<T>(key: any, item: T) {
    if (this.cache.size >= this.maxSize) {
      this.stats.evicted++;
      this.cache.delete(this.cache.keys().next().value);
    }
    this.cache.delete(key);
    this.cache.set(key, { item, cachedAt: Date.now() });
  }

  async cached<T>(key: any, retrieve: () => Promise<T>, duration?: number) {
    let item = this.get<T>(key, duration);
    if (CACHE_ENABLED && item) {
      return item;
    }

    item = await retrieve();
    this.set<T>(key, item);
    return item;
  }

  clear(partialKey: string) {
    const keysToDelete = Array.from(this.cache.keys()).filter((key) =>
      (key.toString() as string).includes(partialKey),
    );
    keysToDelete.forEach((key) => this.cache.delete(key));
    this.stats.cleared += keysToDelete.length;
  }
}

// not nestified, but whatever, for now.
const inMemoryCache = new InMemoryLruCache();
export function cache<T>(
  topic: string,
  key: any,
  retrieve: () => Promise<T>,
  duration?: number,
) {
  return inMemoryCache.cached<T>(topic + key, retrieve, duration);
}

export function clearCache(partialKey: string) {
  return inMemoryCache.clear(partialKey);
}
