// src/main/bridge.ts

import { contextBridge, ipcRenderer } from "electron";

// --- 1. Интерфейс Моста (API Контракт) ---
// Этот интерфейс строго типизирует то, что Renderer может вызывать.
export interface IpcBridge {
  // Асинхронные вызовы (Promise)
  getAppVersion: () => Promise<string>;

  // Здесь будут методы для UI:
  // db:getTrackedArtists: () => Promise<TrackedArtist[]>;
  // api:checkUpdatesForArtist: (artistId: number) => Promise<void>;
  // ...
}

// --- 2. Реализация Моста ---
const ipcBridge: IpcBridge = {
  // Используем invoke для отправки асинхронных сообщений в Main
  getAppVersion: () => ipcRenderer.invoke("app:get-version"),

  // Методы для других IPC хендлеров
  // ...
};

// --- 3. Экспозиция в Главный Мир (Безопасность) ---
// contextBridge.exposeInMainWorld: КРИТИЧЕСКИЙ шаг для безопасности.
// Он делает API доступным в Renderer (window.api) БЕЗ предоставления
// Renderer прямого доступа к Node.js.
contextBridge.exposeInMainWorld("api", ipcBridge);
