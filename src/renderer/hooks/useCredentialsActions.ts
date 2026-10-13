import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import log from "electron-log/renderer";
import type { ProviderId } from "@shared/constants";
import type { IpcSettings } from "@shared/schemas/settings";
import { normalizeCredentialsInput } from "@shared/utils/parse-credentials";

export type AccountFeedbackStatus = "idle" | "success" | "error";

const BASE_PROVIDER_CACHE_ROOTS = [
  "posts",
  "search",
  "playlist-posts",
  "artists",
] as const;

export type SaveApiKeyInput = {
  userId: string;
  apiKey: string;
  /** Explicit provider for the save payload when `includeProviderOnSave` is true. */
  provider: ProviderId;
};

export type UseCredentialsActionsOptions = {
  setAccountStatus: (status: AccountFeedbackStatus) => void;
  /** Account gate requires both fields; Settings page only requires apiKey. */
  requireUserId: boolean;
  /** When true, `saveSettings` includes `provider` (account gate). */
  includeProviderOnSave: boolean;
  /**
   * Resolve the userId sent to IPC after normalize.
   * Gate: normalized only (already required). Settings: normalized ?? raw trim.
   */
  resolveSaveUserId: (args: {
    normalizedUserId: string | undefined;
    rawUserId: string;
  }) => string;
  /**
   * Site-specific local cleanup / optimistic UI after a successful save
   * (before settings invalidation completes).
   */
  onAfterSaveSuccess: (normalized: {
    userId: string | undefined;
    apiKey: string;
  }) => void | Promise<void>;
  /** App gate: optimistic React Query patch for userId/hasApiKey. */
  patchSettingsCacheOnSave?: boolean;
  /** App gate: refetch settings after invalidate. */
  refetchSettingsAfterSave?: boolean;
  /** App gate: invalidate `["search"]` after save. */
  invalidateSearchAfterSave?: boolean;
  /**
   * Extra React Query root keys invalidated before provider save
   * (Settings adds `updates` + `stats`).
   */
  extraProviderInvalidationRoots?: readonly string[];
  /** Settings: optimistic provider select + rollback on failure. */
  applyProviderOptimistic?: {
    getCurrent: () => ProviderId;
    setCurrent: (provider: ProviderId) => void;
  };
  /** Settings: set accountStatus success/error on provider change. */
  reportProviderChangeStatus?: boolean;
  /** Settings: auto-clear account badge after timeout. */
  onAccountStatusSettled?: (status: AccountFeedbackStatus) => void;
  /** Exact log prefixes preserved per call site. */
  logSaveFailure: string;
  logProviderFailure: string;
};

/**
 * Shared credentials save + provider-change IPC/invalidation flow for the
 * account gate (App) and Settings → Account tab.
 *
 * Lives in `renderer/hooks/` (cross-feature IPC orchestration), not
 * `lib/hooks/` (generic UI utilities) or feature-local hooks.
 */
export function useCredentialsActions(
  options: UseCredentialsActionsOptions
): {
  saveApiKey: (input: SaveApiKeyInput) => Promise<void>;
  changeProvider: (nextProvider: ProviderId) => Promise<void>;
} {
  const queryClient = useQueryClient();
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  });

  const saveApiKey = useCallback(
    async (input: SaveApiKeyInput): Promise<void> => {
      const opts = optionsRef.current;
      opts.setAccountStatus("idle");
      try {
        const normalized = normalizeCredentialsInput({
          userId: input.userId,
          apiKey: input.apiKey,
        });
        if (!normalized.apiKey) {
          opts.setAccountStatus("error");
          opts.onAccountStatusSettled?.("error");
          return;
        }
        if (opts.requireUserId && !normalized.userId) {
          opts.setAccountStatus("error");
          opts.onAccountStatusSettled?.("error");
          return;
        }

        const userIdForSave = opts.resolveSaveUserId({
          normalizedUserId: normalized.userId,
          rawUserId: input.userId,
        });

        const saved = await window.api.saveSettings({
          userId: userIdForSave,
          apiKey: normalized.apiKey,
          ...(opts.includeProviderOnSave ? { provider: input.provider } : {}),
        });
        if (!saved) {
          opts.setAccountStatus("error");
          opts.onAccountStatusSettled?.("error");
          return;
        }

        await opts.onAfterSaveSuccess({
          userId: normalized.userId,
          apiKey: normalized.apiKey,
        });

        if (opts.patchSettingsCacheOnSave) {
          queryClient.setQueryData<IpcSettings>(["settings"], (current) => {
            if (!current) {
              return current;
            }
            return {
              ...current,
              userId: normalized.userId ?? current.userId,
              hasApiKey: true,
            };
          });
        }

        await queryClient.invalidateQueries({ queryKey: ["settings"] });
        if (opts.refetchSettingsAfterSave) {
          await queryClient.refetchQueries({ queryKey: ["settings"] });
        }
        if (opts.invalidateSearchAfterSave) {
          await queryClient.invalidateQueries({ queryKey: ["search"] });
        }

        opts.setAccountStatus("success");
        opts.onAccountStatusSettled?.("success");
      } catch (error: unknown) {
        log.error(opts.logSaveFailure, error);
        opts.setAccountStatus("error");
        opts.onAccountStatusSettled?.("error");
      }
    },
    [queryClient]
  );

  const changeProvider = useCallback(
    async (nextProvider: ProviderId): Promise<void> => {
      const opts = optionsRef.current;
      const previousProvider = opts.applyProviderOptimistic?.getCurrent();
      opts.applyProviderOptimistic?.setCurrent(nextProvider);

      try {
        const extraRoots = opts.extraProviderInvalidationRoots ?? [];
        await queryClient.invalidateQueries({
          predicate: ({ queryKey }) => {
            const root = queryKey[0];
            if (typeof root !== "string") {
              return false;
            }
            for (const baseRoot of BASE_PROVIDER_CACHE_ROOTS) {
              if (root === baseRoot) {
                return true;
              }
            }
            return extraRoots.includes(root);
          },
        });
        await window.api.saveSettings({ provider: nextProvider });
        await queryClient.invalidateQueries({ queryKey: ["settings"] });
        if (opts.reportProviderChangeStatus) {
          opts.setAccountStatus("success");
          opts.onAccountStatusSettled?.("success");
        }
      } catch (error: unknown) {
        log.error(opts.logProviderFailure, error);
        if (
          previousProvider !== undefined &&
          opts.applyProviderOptimistic !== undefined
        ) {
          opts.applyProviderOptimistic.setCurrent(previousProvider);
        }
        if (opts.reportProviderChangeStatus) {
          opts.setAccountStatus("error");
          opts.onAccountStatusSettled?.("error");
        }
      }
    },
    [queryClient]
  );

  return { saveApiKey, changeProvider };
}
