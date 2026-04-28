import type { IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import { z } from "zod";

type ValidationErrorHandler<TResult> = (
  error: z.ZodError,
  rawPayload: unknown
) => Promise<TResult> | TResult;

export function createValidatedHandler<TSchema extends z.ZodTypeAny, TResult>(
  channel: string,
  schema: TSchema,
  handler: (
    event: IpcMainInvokeEvent,
    parsedPayload: z.infer<TSchema>
  ) => Promise<TResult> | TResult,
  onValidationError?: ValidationErrorHandler<TResult>
): (event: IpcMainInvokeEvent, rawPayload: unknown) => Promise<TResult> | TResult {
  return (event, rawPayload) => {
    const validationResult = schema.safeParse(rawPayload);
    if (!validationResult.success) {
      log.error(`[IPC] Invalid payload for ${channel}:`, validationResult.error.flatten());

      if (onValidationError) {
        return onValidationError(validationResult.error, rawPayload);
      }

      throw new Error(`Invalid IPC payload for ${channel}`);
    }

    return handler(event, validationResult.data);
  };
}
