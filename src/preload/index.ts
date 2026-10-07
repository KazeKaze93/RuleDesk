import type { SetVacuumScheduleArgs } from "../shared/schemas/maintenance";
import { invokeIpc } from "./invoke-ipc";

export const maintenancePreloadApi = {
  getVacuumStatus: () => invokeIpc("maintenance:get-vacuum-status"),
  runVacuum: () => invokeIpc("maintenance:run-vacuum"),
  getVacuumSchedule: () => invokeIpc("maintenance:get-vacuum-schedule"),
  setVacuumSchedule: (args: SetVacuumScheduleArgs) =>
    invokeIpc("maintenance:set-vacuum-schedule", args),
};
