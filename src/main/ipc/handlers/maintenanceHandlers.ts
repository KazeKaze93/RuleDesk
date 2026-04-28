import { ipcMain } from "electron";
import log from "electron-log";
import { SetVacuumScheduleArgsSchema } from "../../../shared/schemas/maintenance";
import { MaintenanceService } from "../../services/MaintenanceService";
import { parseNoArgs, parseSingleArg } from "./ipcArgValidation";

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
    parseNoArgs(args);

    try {
      return maintenanceService.getVacuumStatus();
    } catch (error) {
      log.error("[MaintenanceHandlers] get-vacuum-status failed:", error);
      throw new Error(sanitizeErrorMessage(error));
    }
  });

  ipcMain.handle("maintenance:run-vacuum", (_event, ...args: unknown[]) => {
    parseNoArgs(args);

    try {
      return maintenanceService.runVacuum();
    } catch (error) {
      log.error("[MaintenanceHandlers] run-vacuum failed:", error);
      throw new Error(sanitizeErrorMessage(error));
    }
  });

  ipcMain.handle("maintenance:get-vacuum-schedule", (_event, ...args: unknown[]) => {
    parseNoArgs(args);

    try {
      return maintenanceService.getSchedule();
    } catch (error) {
      log.error("[MaintenanceHandlers] get-vacuum-schedule failed:", error);
      throw new Error(sanitizeErrorMessage(error));
    }
  });

  ipcMain.handle("maintenance:set-vacuum-schedule", (_event, ...args: unknown[]) => {
    const payload = parseSingleArg(SetVacuumScheduleArgsSchema, args);

    try {
      return maintenanceService.setSchedule(payload.schedule);
    } catch (error) {
      log.error("[MaintenanceHandlers] set-vacuum-schedule failed:", error);
      throw new Error(sanitizeErrorMessage(error));
    }
  });

  isRegistered = true;
  log.info("[MaintenanceHandlers] Registered");
}
