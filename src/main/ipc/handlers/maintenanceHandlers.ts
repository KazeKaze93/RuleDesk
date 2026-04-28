import { ipcMain } from "electron";
import log from "electron-log";
import { z } from "zod";
import { SetVacuumScheduleArgsSchema } from "../../../shared/schemas/maintenance";
import { MaintenanceService } from "../../services/MaintenanceService";

const EMPTY_ARGS_SCHEMA = z.tuple([]);

let isRegistered = false;

function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return "Operation failed";
}

export function registerMaintenanceHandlers(
  maintenanceService: MaintenanceService
): void {
  if (isRegistered) {
    return;
  }

  ipcMain.handle("maintenance:get-vacuum-status", (_event, ...args: unknown[]) => {
    const parsed = EMPTY_ARGS_SCHEMA.safeParse(args);
    if (!parsed.success) {
      throw new Error("Invalid arguments");
    }

    try {
      return maintenanceService.getVacuumStatus();
    } catch (error) {
      log.error("[MaintenanceHandlers] get-vacuum-status failed:", error);
      throw new Error(sanitizeErrorMessage(error));
    }
  });

  ipcMain.handle("maintenance:run-vacuum", (_event, ...args: unknown[]) => {
    const parsed = EMPTY_ARGS_SCHEMA.safeParse(args);
    if (!parsed.success) {
      throw new Error("Invalid arguments");
    }

    try {
      return maintenanceService.runVacuum();
    } catch (error) {
      log.error("[MaintenanceHandlers] run-vacuum failed:", error);
      throw new Error(sanitizeErrorMessage(error));
    }
  });

  ipcMain.handle("maintenance:get-vacuum-schedule", (_event, ...args: unknown[]) => {
    const parsed = EMPTY_ARGS_SCHEMA.safeParse(args);
    if (!parsed.success) {
      throw new Error("Invalid arguments");
    }

    try {
      return maintenanceService.getSchedule();
    } catch (error) {
      log.error("[MaintenanceHandlers] get-vacuum-schedule failed:", error);
      throw new Error(sanitizeErrorMessage(error));
    }
  });

  ipcMain.handle("maintenance:set-vacuum-schedule", (_event, ...args: unknown[]) => {
    const parsedTuple = z.tuple([SetVacuumScheduleArgsSchema]).safeParse(args);
    if (!parsedTuple.success) {
      throw new Error("Invalid arguments");
    }

    try {
      return maintenanceService.setSchedule(parsedTuple.data[0].schedule);
    } catch (error) {
      log.error("[MaintenanceHandlers] set-vacuum-schedule failed:", error);
      throw new Error(sanitizeErrorMessage(error));
    }
  });

  isRegistered = true;
  log.info("[MaintenanceHandlers] Registered");
}
