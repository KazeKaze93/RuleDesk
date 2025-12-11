import { contextBridge, ipcRenderer } from "electron";

// --- 1. Интерфейс Моста (API Контракт) ---
// Этот интерфейс строго типизирует то, что Renderer может вызывать.
export interface IpcBridge {
  getAppVersion: () => Promise<string>;
  getTrackedArtists: () => Promise<any[]>;
}

// --- 2. Реализация ---
const ipcBridge: IpcBridge = {
  getAppVersion: () => ipcRenderer.invoke("app:get-version"),
  getTrackedArtists: () => ipcRenderer.invoke("db:get-artists"),
};

// --- 3. Экспозиция в Главный Мир (Безопасность) ---
// Renderer прямого доступа к Node.js.
contextBridge.exposeInMainWorld("api", ipcBridge);
