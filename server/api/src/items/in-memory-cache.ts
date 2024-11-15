class InMemoryLruCache {
  private cache = new Map<any, any>();

  constructor(private maxSize: number = 10_000) {}

  private get<T>(key: any): T | undefined {
    const item = this.cache.get(key);

    if (item) {
      this.cache.delete(key);
      this.cache.set(key, item);
    }

    return item;
  }

  private set<T>(key: any, item: T) {
    if (this.cache.size >= this.maxSize) {
      this.cache.delete(this.cache.keys().next().value);
    }
    this.cache.delete(key);
    this.cache.set(key, item);
  }

  async cached<T>(key: any, retrieve: () => Promise<T>) {
    let item = this.get<T>(key);
    if (item) {
      return item;
    }

    item = await retrieve();
    this.set<T>(key, item);
    return item;
  }
}

// not nestified, but whatever, for now.
const inMemoryCache = new InMemoryLruCache();
export function cache<T>(topic: string, key: any, retrieve: () => Promise<T>) {
  return inMemoryCache.cached<T>(topic + key, retrieve);
}
