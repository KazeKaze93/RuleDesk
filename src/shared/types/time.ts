/**
 * Branded epoch time units. Prevents accidental Seconds/Millis mix-ups at
 * compile time. Constructors are the only intentional `as` sites for these brands.
 */

declare const SecondsBrand: unique symbol;
declare const MillisBrand: unique symbol;

export type Seconds = number & { readonly [SecondsBrand]: true };
export type Millis = number & { readonly [MillisBrand]: true };

const MS_PER_SECOND = 1000;

/** Construct a Seconds value from a raw unix-seconds number (DB / provider). */
export function asSeconds(value: number): Seconds {
  // boundary: branded Seconds constructor (allowlist in .cursorrules)
  // eslint-disable-next-line no-restricted-syntax, @typescript-eslint/no-unsafe-type-assertion -- boundary: branded Seconds constructor
  return value as Seconds;
}

/** Construct a Millis value from a raw unix-milliseconds number (Date.now / TTL). */
export function asMillis(value: number): Millis {
  // boundary: branded Millis constructor (allowlist in .cursorrules)
  // eslint-disable-next-line no-restricted-syntax, @typescript-eslint/no-unsafe-type-assertion -- boundary: branded Millis constructor
  return value as Millis;
}

export function secondsToMillis(seconds: Seconds): Millis {
  return asMillis(seconds * MS_PER_SECOND);
}

export function millisToSeconds(millis: Millis): Seconds {
  return asSeconds(Math.floor(millis / MS_PER_SECOND));
}

/** Current wall time in milliseconds (branded). */
export function nowMillis(): Millis {
  return asMillis(Date.now());
}

/** Current wall time in unix seconds (branded) — for raw SQL against timestamp columns. */
export function nowSeconds(): Seconds {
  return millisToSeconds(nowMillis());
}

export function dateToMillis(date: Date): Millis {
  return asMillis(date.getTime());
}

export function dateToSeconds(date: Date): Seconds {
  return millisToSeconds(dateToMillis(date));
}

export function millisToDate(millis: Millis): Date {
  return new Date(millis);
}

export function secondsToDate(seconds: Seconds): Date {
  return millisToDate(secondsToMillis(seconds));
}
