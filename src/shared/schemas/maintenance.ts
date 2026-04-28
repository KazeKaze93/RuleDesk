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

export type VacuumSchedule = z.infer<typeof VacuumScheduleSchema>;
export type VacuumStatusResponse = z.infer<typeof VacuumStatusResponseSchema>;
export type RunVacuumResponse = z.infer<typeof RunVacuumResponseSchema>;
export type SetVacuumScheduleArgs = z.infer<typeof SetVacuumScheduleArgsSchema>;
