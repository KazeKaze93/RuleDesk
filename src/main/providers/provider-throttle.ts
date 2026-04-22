const DEFAULT_MIN_INTERVAL_MS = 1200;
const DEFAULT_JITTER_MS = 400;

const SHARED_USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.119 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.118 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 13.6; rv:124.0) Gecko/20100101 Firefox/124.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.155 Safari/537.36",
  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0",
];

export class ProviderThrottle {
  private lastRequestAt = 0;
  private readonly minIntervalMs: number;
  private readonly jitterMs: number;

  constructor(
    minIntervalMs = DEFAULT_MIN_INTERVAL_MS,
    jitterMs = DEFAULT_JITTER_MS
  ) {
    this.minIntervalMs = minIntervalMs;
    this.jitterMs = jitterMs;
  }

  async wait(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestAt;
    const jitter = Math.random() * this.jitterMs;
    const requiredWait = this.minIntervalMs + jitter - elapsed;
    if (requiredWait > 0) {
      await new Promise((resolve) => setTimeout(resolve, requiredWait));
    }
    this.lastRequestAt = Date.now();
  }
}

export function pickRandomUA(): string {
  return SHARED_USER_AGENTS[
    Math.floor(Math.random() * SHARED_USER_AGENTS.length)
  ];
}
