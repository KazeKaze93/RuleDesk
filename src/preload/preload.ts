import { contextBridge, ipcRenderer } from 'electron';

export interface IpcBridge {
  getAppVersion: () => Promise<string>;
}

const api: IpcBridge = {
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
};

contextBridge.exposeInMainWorld('api', api);

declare global {
  interface Window {
    api: IpcBridge;
  }
}

