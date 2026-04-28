import { ipcRenderer } from "electron";
import type { SetVacuumScheduleArgs } from "../shared/schemas/maintenance";

export const maintenancePreloadApi = {
  getVacuumStatus: () => ipcRenderer.invoke("maintenance:get-vacuum-status"),
  runVacuum: () => ipcRenderer.invoke("maintenance:run-vacuum"),
  getVacuumSchedule: () => ipcRenderer.invoke("maintenance:get-vacuum-schedule"),
  setVacuumSchedule: (args: SetVacuumScheduleArgs) =>
    ipcRenderer.invoke("maintenance:set-vacuum-schedule", args),
};
