import { app, ipcMain } from 'electron';

export function registerIpcHandlers(): void {
  ipcMain.handle('app:getVersion', () => app.getVersion());
}

