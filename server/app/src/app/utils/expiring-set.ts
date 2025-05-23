// Array of unique values that expire automatically
// expiresIn: determines how long (in milliseconds) until a value expires after being added
// onExpired (optional): callback when a value expires
// isEqual (optional): specify object equality to enforce uniqueness; defaults to value1 === value2
export class ExpiringSet<T> {
  // values and expiration timeouts are kept in sync so the timeout for value[x] is at timeout[x]
  // Don't add/remove values outside of the ExpiringSet functions
  public values: T[] = [];
  private timeouts: any[] = [];

  constructor(
    private expiresIn: (item: T) => number,
    private onExpired?: (item: T) => void,
    private isEqual = (value1: T, value2: T) => value1 === value2
  ) {}

  add(...values: T[]) {
    values.forEach((value) => {
      // If it's already expired, remove it rather than add it
      const expiresIn = this.expiresIn(value);
      if (expiresIn <= 0) {
        return this.delete(value);
      }

      // Find the index of the value, or use the next available index
      let index = this.indexOf(value);
      if (index === -1) {
        index = this.values.length;
      }

      // Clear the existing timeout (if it exists)
      clearTimeout(this.timeouts[index]);

      // Set the value and expiration timeout on the same index
      this.values[index] = value;
      this.timeouts[index] = setTimeout(
        () => this.expire(value),
        this.expiresIn(value)
      );
    });
  }

  delete(value: T) {
    const index = this.indexOf(value);
    if (index === -1) {
      return;
    }

    // Clear the timeout, remove the value and timeout by index
    clearTimeout(this.timeouts[index]);
    this.values.splice(index, 1);
    this.timeouts.splice(index, 1);
  }

  indexOf(value: T) {
    return this.values.findIndex((value2) => this.isEqual(value, value2));
  }

  private expire = (value: T) => {
    this.delete(value);
    if (this.onExpired) {
      this.onExpired(value);
    }
  };
}
