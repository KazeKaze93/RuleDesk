/**
 * What the script writes to the console: only what went wrong, a warning or
 * an error, always under the script's name. There is no chatter and no switch
 * for it: the lines of a run that went well, and the hidden storage key that
 * showed them, were for the making of the script and are gone.
 */
export const log = {
  warn(message: string, ...details: unknown[]): void {
    console.warn(`[ruledesk-web] ${message}`, ...details);
  },
  error(message: string, ...details: unknown[]): void {
    console.error(`[ruledesk-web] ${message}`, ...details);
  },
};
