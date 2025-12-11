import { contextBridge, ipcRenderer } from "electron";
import { Artist } from "./db/schema";

// --- 1. Интерфейс Моста ---
// ЕДИНСТВЕННОЕ определение интерфейса
export interface IpcBridge {
  getAppVersion: () => Promise<string>;
  getTrackedArtists: () => Promise<Artist[]>;
  addArtist: (artist: any) => Promise<any>;
}

// --- 2. Реализация ---
// Создаем объект, соответствующий интерфейсу
const ipcBridge: IpcBridge = {
  getAppVersion: () => ipcRenderer.invoke("app:get-version"),
  getTrackedArtists: () => ipcRenderer.invoke("db:get-artists"),
  addArtist: (artist) => ipcRenderer.invoke("db:add-artist", artist),
};

// --- 3. Экспозиция ---
// Открываем API для Renderer
contextBridge.exposeInMainWorld("api", ipcBridge);
