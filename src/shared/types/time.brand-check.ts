/**
 * Compile-time brand checks for Seconds vs Millis.
 * Not imported at runtime — exists so `tsc` rejects unit mix-ups.
 */
import {
  asMillis,
  asSeconds,
  secondsToMillis,
  type Millis,
  type Seconds,
} from "./time";

declare function takesMillis(value: Millis): void;
declare function takesSeconds(value: Seconds): void;

const seconds = asSeconds(1);
const millis = asMillis(1000);

takesMillis(secondsToMillis(seconds));
takesSeconds(seconds);
takesMillis(millis);

// @ts-expect-error Seconds must not be accepted where Millis is required
takesMillis(seconds);

// @ts-expect-error Millis must not be accepted where Seconds is required
takesSeconds(millis);
