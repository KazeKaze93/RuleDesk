import { SaveSettingsSchema, type SaveSettings } from "../../shared/schemas/settings";

/**
 * Credentials Form Schema
 *
 * Re-exports SaveSettingsSchema for convenience in form validation.
 * This ensures single source of truth - both Main and Renderer use the same validation rules.
 */
export const credsBaseSchema = SaveSettingsSchema;
export type CredsFormValues = SaveSettings;
