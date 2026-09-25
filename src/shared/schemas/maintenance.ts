import { z } from "zod";

export const VacuumScheduleSchema = z.enum(["manual", "weekly", "monthly"]);

export const VacuumStatusResponseSchema = z.object({
  lastVacuumAt: z.number().nullable(),
  lastRunStatus: z.enum(["never", "success", "error"]),
  lastError: z.string().nullable(),
  isRunning: z.boolean(),
});

export const RunVacuumResponseSchema = z.object({
  success: z.boolean(),
  startedAt: z.number(),
  finishedAt: z.number().optional(),
  durationMs: z.number().optional(),
  error: z.string().optional(),
});

export const SetVacuumScheduleArgsSchema = z.object({
  schedule: VacuumScheduleSchema,
});

export const OrphanDetectionReportSchema = z.object({
  orphanedPostsCount: z.number().int().nonnegative(),
  orphanedPostIdsSample: z.array(z.number().int()),
  orphanedPlaylistEntriesCount: z.number().int().nonnegative(),
  orphanedPlaylistEntrySamples: z.array(
    z.object({
      playlistId: z.number().int(),
      postId: z.number().int(),
    })
  ),
  ftsRowsWithoutPostCount: z.number().int().nonnegative(),
  ghostArtistIds: z.array(z.number().int()),
  postsPerGhostArtist: z.array(
    z.object({
      artistId: z.number().int(),
      postCount: z.number().int().nonnegative(),
    })
  ),
});

export type VacuumSchedule = z.infer<typeof VacuumScheduleSchema>;
export type VacuumStatusResponse = z.infer<typeof VacuumStatusResponseSchema>;
export type RunVacuumResponse = z.infer<typeof RunVacuumResponseSchema>;
export type SetVacuumScheduleArgs = z.infer<typeof SetVacuumScheduleArgsSchema>;
export type OrphanDetectionReport = z.infer<typeof OrphanDetectionReportSchema>;

/** IPC `maintenance:should-show-backup-prompt` — no args, returns boolean. */
export const ShouldShowBackupPromptResponseSchema = z.boolean();

/** IPC `maintenance:mark-backup-prompt-seen` — no args, returns boolean. */
export const MarkBackupPromptSeenResponseSchema = z.boolean();

export type ShouldShowBackupPromptResponse = z.infer<
  typeof ShouldShowBackupPromptResponseSchema
>;
export type MarkBackupPromptSeenResponse = z.infer<
  typeof MarkBackupPromptSeenResponseSchema
>;
